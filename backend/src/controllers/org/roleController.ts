import Role from '../../models/org/roleModel';
import Membership from '../../models/org/membershipModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import { ensureSystemRoles } from '../../services/permissionService';
import { roleSchema, roleUpdateSchema } from '../../validation/orgSchemas';
import { PERMISSION_GROUPS, PERMISSIONS } from '../../rbac/permissions';

const toClient = (doc: any, memberCount = 0) => ({
  id: String(doc._id),
  key: doc.key,
  name: doc.name,
  description: doc.description ?? '',
  rank: doc.rank,
  permissions: doc.permissions ?? [],
  isSystem: Boolean(doc.isSystem),
  memberCount,
});

const slugKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50);

/** System roles + this organization's custom roles. */
export const listRoles = asyncHandler<AuthRequest>(async (req, res) => {
  await ensureSystemRoles();

  const roles = await Role.find({
    $or: [{ organization: null }, { organization: req.organizationId }],
  }).sort({ rank: 1, name: 1 });

  const counts = await Membership.aggregate([
    { $match: { organization: (roles[0] as any)?.organization ?? undefined } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  res.json({
    roles: roles.map((doc) =>
      toClient(
        doc,
        counts.find((row) => String(row._id) === String(doc._id))?.count ?? 0
      )
    ),
    catalogue: { permissions: PERMISSIONS, groups: PERMISSION_GROUPS },
  });
});

export const createRole = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const key = slugKey(parsed.data.name);
  const exists = await Role.exists({ organization: req.organizationId, key });
  if (exists) throw new HttpError(409, 'A role with that name already exists');

  const role = await Role.create({
    ...parsed.data,
    key,
    organization: req.organizationId,
    isSystem: false,
  });

  await recordAudit(req, {
    action: 'role.create',
    entityType: 'role',
    entityId: String(role._id),
    summary: `Created custom role ${role.name}`,
    metadata: { permissions: role.permissions },
  });

  res.status(201).json(toClient(role));
});

export const updateRole = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = roleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const role = await Role.findOne({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!role) throw new HttpError(404, 'Custom role not found');
  if (role.isSystem) throw new HttpError(403, 'System roles cannot be edited');

  Object.assign(role, parsed.data);
  await role.save();

  await recordAudit(req, {
    action: 'role.update',
    entityType: 'role',
    entityId: String(role._id),
    summary: `Updated role ${role.name}`,
    metadata: { permissions: role.permissions },
  });

  res.json(toClient(role));
});

export const deleteRole = asyncHandler<AuthRequest>(async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!role) throw new HttpError(404, 'Custom role not found');
  if (role.isSystem) throw new HttpError(403, 'System roles cannot be deleted');

  const inUse = await Membership.countDocuments({ role: role._id });
  if (inUse > 0) {
    throw new HttpError(409, `${inUse} member(s) still hold this role`);
  }

  await Role.deleteOne({ _id: role._id });

  await recordAudit(req, {
    action: 'role.delete',
    entityType: 'role',
    entityId: String(role._id),
    summary: `Deleted role ${role.name}`,
  });

  res.json({ ok: true });
});
