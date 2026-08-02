import { Response } from 'express';
import crypto from 'crypto';
import Organization from '../../models/org/organizationModel';
import Department from '../../models/org/departmentModel';
import Project from '../../models/org/projectModel';
import Team from '../../models/org/teamModel';
import Membership from '../../models/org/membershipModel';
import Role from '../../models/org/roleModel';
import Task from '../../models/taskModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import {
  effectivePermissions,
  ensureSystemRoles,
  listUserOrganizations,
  resolveAccess,
} from '../../services/permissionService';
import {
  organizationSchema,
  organizationUpdateSchema,
} from '../../validation/orgSchemas';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || `org-${crypto.randomBytes(3).toString('hex')}`;

async function uniqueSlug(base: string) {
  let slug = base;
  let suffix = 1;
  while (await Organization.exists({ slug })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

const publicOrg = (org: any) => ({
  id: String(org._id),
  name: org.name,
  slug: org.slug,
  plan: org.plan,
  owner: String(org.owner),
  settings: org.settings,
});

/** Organizations the caller belongs to. */
export const listOrganizations = asyncHandler<AuthRequest>(async (req, res) => {
  res.json({ organizations: await listUserOrganizations(req.userId!) });
});

export const createOrganization = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = organizationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const roles = await ensureSystemRoles();
  const orgAdmin = roles.get('org_admin');
  if (!orgAdmin) throw new HttpError(500, 'System roles are not initialised');

  const slug = await uniqueSlug(parsed.data.slug ?? slugify(parsed.data.name));

  const organization = await Organization.create({
    name: parsed.data.name,
    slug,
    plan: parsed.data.plan ?? 'free',
    owner: req.userId,
  });

  await Membership.create({
    organization: organization._id,
    user: req.userId,
    role: orgAdmin._id,
    scopeType: 'organization',
  });

  req.organizationId = String(organization._id);
  await recordAudit(req, {
    action: 'organization.create',
    entityType: 'organization',
    entityId: String(organization._id),
    summary: `Created organization ${organization.name}`,
  });

  res.status(201).json(publicOrg(organization));
});

/** Active organization plus the caller's effective permissions. */
export const getContext = asyncHandler<AuthRequest>(async (req, res) => {
  const organization = await Organization.findById(req.organizationId);
  if (!organization) throw new HttpError(404, 'Organization not found');

  const access = req.access ?? (await resolveAccess(req.userId!, req.organizationId!));

  const [departments, projects, teams, members] = await Promise.all([
    Department.countDocuments({ organization: organization._id }),
    Project.countDocuments({ organization: organization._id }),
    Team.countDocuments({ organization: organization._id }),
    Membership.countDocuments({ organization: organization._id, status: 'active' }),
  ]);

  res.json({
    organization: publicOrg(organization),
    organizations: await listUserOrganizations(req.userId!),
    permissions: effectivePermissions(access),
    roles: access.roles,
    isOwner: access.isOwner,
    counts: { departments, projects, teams, members },
  });
});

export const updateOrganization = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = organizationUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.plan) update.plan = parsed.data.plan;
  if (parsed.data.settings) {
    Object.entries(parsed.data.settings).forEach(([key, value]) => {
      if (value !== undefined) update[`settings.${key}`] = value;
    });
  }

  const organization = await Organization.findByIdAndUpdate(
    req.organizationId,
    update,
    { new: true }
  );
  if (!organization) throw new HttpError(404, 'Organization not found');

  await recordAudit(req, {
    action: 'organization.update',
    entityType: 'organization',
    entityId: String(organization._id),
    summary: `Updated organization settings`,
    metadata: update,
  });

  res.json(publicOrg(organization));
});

export const deleteOrganization = asyncHandler<AuthRequest>(async (req, res) => {
  const organization = await Organization.findById(req.organizationId);
  if (!organization) throw new HttpError(404, 'Organization not found');
  if (String(organization.owner) !== String(req.userId)) {
    throw new HttpError(403, 'Only the organization owner can delete it');
  }

  const id = organization._id;
  await Promise.all([
    Department.deleteMany({ organization: id }),
    Project.deleteMany({ organization: id }),
    Team.deleteMany({ organization: id }),
    Membership.deleteMany({ organization: id }),
    Role.deleteMany({ organization: id }),
    Task.deleteMany({ organization: id }),
  ]);
  await Organization.deleteOne({ _id: id });

  await recordAudit(req, {
    action: 'organization.delete',
    entityType: 'organization',
    entityId: String(id),
    summary: `Deleted organization ${organization.name}`,
  });

  res.json({ ok: true });
});
