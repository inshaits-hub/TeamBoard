import crypto from 'crypto';
import Membership from '../../models/org/membershipModel';
import Invitation from '../../models/org/invitationModel';
import Role from '../../models/org/roleModel';
import User from '../../models/userModel';
import Organization from '../../models/org/organizationModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import { hashPassword } from '../../utils/hash';
import { generateToken } from '../../utils/jwt';
import {
  acceptInviteSchema,
  invitationSchema,
  membershipUpdateSchema,
} from '../../validation/orgSchemas';

const INVITE_TTL_DAYS = 14;

const memberToClient = (doc: any) => ({
  id: String(doc._id),
  userId: doc.user ? String(doc.user._id ?? doc.user) : '',
  name: doc.user?.name ?? '',
  email: doc.user?.email ?? '',
  role: doc.role
    ? { id: String(doc.role._id ?? doc.role), name: doc.role.name, key: doc.role.key }
    : null,
  scopeType: doc.scopeType,
  scopeId: doc.scopeId ? String(doc.scopeId) : null,
  reportsTo: doc.reportsTo ? String(doc.reportsTo) : null,
  title: doc.title ?? '',
  status: doc.status,
  joinedAt: doc.createdAt,
});

export const listMembers = asyncHandler<AuthRequest>(async (req, res) => {
  const memberships = await Membership.find({ organization: req.organizationId })
    .populate('user', 'name email')
    .populate('role', 'name key')
    .sort({ createdAt: 1 });

  res.json({ members: memberships.map(memberToClient) });
});

export const updateMembership = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = membershipUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const membership = await Membership.findOne({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!membership) throw new HttpError(404, 'Membership not found');

  const organization = await Organization.findById(req.organizationId).select('owner');
  if (
    String(organization?.owner) === String(membership.user) &&
    (parsed.data.roleId || parsed.data.status)
  ) {
    throw new HttpError(403, 'The organization owner cannot be demoted or suspended');
  }

  if (parsed.data.roleId) {
    const role = await Role.findOne({
      _id: parsed.data.roleId,
      $or: [{ organization: null }, { organization: req.organizationId }],
    });
    if (!role) throw new HttpError(404, 'Role not found');
    membership.role = role._id;
  }
  if (parsed.data.title !== undefined) membership.title = parsed.data.title;
  if (parsed.data.reportsTo !== undefined) {
    membership.reportsTo = (parsed.data.reportsTo as any) ?? null;
  }
  if (parsed.data.status) membership.status = parsed.data.status;
  if (parsed.data.scopeType) membership.scopeType = parsed.data.scopeType;
  if (parsed.data.scopeId !== undefined) {
    membership.scopeId = (parsed.data.scopeId as any) ?? null;
  }

  await membership.save();
  await membership.populate('user', 'name email');
  await membership.populate('role', 'name key');

  await recordAudit(req, {
    action: 'member.update',
    entityType: 'membership',
    entityId: String(membership._id),
    summary: `Updated membership for ${(membership.user as any)?.email ?? membership.user}`,
    metadata: parsed.data,
  });

  res.json(memberToClient(membership));
});

export const removeMembership = asyncHandler<AuthRequest>(async (req, res) => {
  const membership = await Membership.findOne({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!membership) throw new HttpError(404, 'Membership not found');

  const organization = await Organization.findById(req.organizationId).select('owner');
  if (String(organization?.owner) === String(membership.user)) {
    throw new HttpError(403, 'The organization owner cannot be removed');
  }

  await Membership.deleteOne({ _id: membership._id });

  await recordAudit(req, {
    action: 'member.remove',
    entityType: 'membership',
    entityId: String(membership._id),
    summary: 'Removed a member from the organization',
  });

  res.json({ ok: true });
});

/** Grants an extra scoped role (department/project/team) to an existing member. */
export const grantScopedRole = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = membershipUpdateSchema
    .required({ roleId: true })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }
  const userId = req.params.userId;

  const existing = await Membership.findOne({
    organization: req.organizationId,
    user: userId,
  });
  if (!existing) throw new HttpError(404, 'User is not a member of this organization');

  const membership = await Membership.findOneAndUpdate(
    {
      organization: req.organizationId,
      user: userId,
      scopeType: parsed.data.scopeType ?? 'organization',
      scopeId: (parsed.data.scopeId as any) ?? null,
    },
    {
      organization: req.organizationId,
      user: userId,
      role: parsed.data.roleId,
      scopeType: parsed.data.scopeType ?? 'organization',
      scopeId: (parsed.data.scopeId as any) ?? null,
      title: parsed.data.title ?? '',
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .populate('user', 'name email')
    .populate('role', 'name key');

  await recordAudit(req, {
    action: 'member.grant_scope',
    entityType: 'membership',
    entityId: String(membership?._id),
    summary: 'Granted a scoped role',
    metadata: parsed.data,
  });

  res.status(201).json(memberToClient(membership));
});

export const listInvitations = asyncHandler<AuthRequest>(async (req, res) => {
  const invitations = await Invitation.find({
    organization: req.organizationId,
    status: 'pending',
  })
    .populate('role', 'name key')
    .sort({ createdAt: -1 });

  res.json({
    invitations: invitations.map((doc: any) => ({
      id: String(doc._id),
      email: doc.email,
      role: doc.role ? { id: String(doc.role._id), name: doc.role.name } : null,
      scopeType: doc.scopeType,
      scopeId: doc.scopeId ? String(doc.scopeId) : null,
      token: doc.token,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    })),
  });
});

export const createInvitation = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = invitationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const role = await Role.findOne({
    _id: parsed.data.roleId,
    $or: [{ organization: null }, { organization: req.organizationId }],
  });
  if (!role) throw new HttpError(404, 'Role not found');

  const existingUser = await User.findOne({ email: parsed.data.email });
  if (existingUser) {
    const alreadyMember = await Membership.exists({
      organization: req.organizationId,
      user: existingUser._id,
      scopeType: parsed.data.scopeType,
      scopeId: (parsed.data.scopeId as any) ?? null,
    });
    if (alreadyMember) throw new HttpError(409, 'That person is already a member');
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await Invitation.create({
    organization: req.organizationId,
    email: parsed.data.email,
    role: role._id,
    scopeType: parsed.data.scopeType,
    scopeId: (parsed.data.scopeId as any) ?? null,
    token: crypto.randomBytes(24).toString('hex'),
    expiresAt,
    invitedBy: req.userId,
  });

  await recordAudit(req, {
    action: 'member.invite',
    entityType: 'invitation',
    entityId: String(invitation._id),
    summary: `Invited ${invitation.email} as ${role.name}`,
  });

  res.status(201).json({
    id: String(invitation._id),
    email: invitation.email,
    token: invitation.token,
    role: { id: String(role._id), name: role.name },
    expiresAt: invitation.expiresAt,
  });
});

export const revokeInvitation = asyncHandler<AuthRequest>(async (req, res) => {
  const invitation = await Invitation.findOneAndUpdate(
    { _id: req.params.id, organization: req.organizationId, status: 'pending' },
    { status: 'revoked' },
    { new: true }
  );
  if (!invitation) throw new HttpError(404, 'Invitation not found');

  await recordAudit(req, {
    action: 'member.invite_revoke',
    entityType: 'invitation',
    entityId: String(invitation._id),
    summary: `Revoked the invitation for ${invitation.email}`,
  });

  res.json({ ok: true });
});

/** Public: redeem an invite token, creating the account when necessary. */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const invitation = await Invitation.findOne({
    token: parsed.data.token,
    status: 'pending',
  });
  if (!invitation) throw new HttpError(404, 'This invitation is no longer valid');
  if (invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new HttpError(410, 'This invitation has expired');
  }

  let user = await User.findOne({ email: invitation.email });
  if (!user) {
    if (!parsed.data.password || !parsed.data.name) {
      throw new HttpError(400, 'Name and password are required to create your account');
    }
    user = await User.create({
      name: parsed.data.name,
      email: invitation.email,
      password: await hashPassword(parsed.data.password),
      role: 'member',
    });
  }

  await Membership.findOneAndUpdate(
    {
      organization: invitation.organization,
      user: user._id,
      scopeType: invitation.scopeType,
      scopeId: invitation.scopeId,
    },
    {
      organization: invitation.organization,
      user: user._id,
      role: invitation.role,
      scopeType: invitation.scopeType,
      scopeId: invitation.scopeId,
      invitedBy: invitation.invitedBy,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  invitation.status = 'accepted';
  await invitation.save();

  res.status(201).json({
    token: generateToken(user._id.toString()),
    organizationId: String(invitation.organization),
  });
});
