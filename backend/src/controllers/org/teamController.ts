import Team from '../../models/org/teamModel';
import Membership from '../../models/org/membershipModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import { teamSchema, teamUpdateSchema } from '../../validation/orgSchemas';

const toClient = (doc: any, memberCount = 0) => ({
  id: String(doc._id),
  name: doc.name,
  description: doc.description ?? '',
  department: doc.department ? String(doc.department) : null,
  parent: doc.parent ? String(doc.parent) : null,
  leader: doc.leader ? String(doc.leader) : null,
  projects: (doc.projects ?? []).map((id: any) => String(id)),
  memberCount,
  createdAt: doc.createdAt,
});

export const listTeams = asyncHandler<AuthRequest>(async (req, res) => {
  const teams = await Team.find({ organization: req.organizationId }).sort({ name: 1 });

  const counts = await Membership.aggregate([
    { $match: { organization: teams[0]?.organization, scopeType: 'team' } },
    { $group: { _id: '$scopeId', count: { $sum: 1 } } },
  ]);

  res.json({
    teams: teams.map((doc) =>
      toClient(
        doc,
        counts.find((row) => String(row._id) === String(doc._id))?.count ?? 0
      )
    ),
  });
});

export const createTeam = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = teamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const exists = await Team.exists({
    organization: req.organizationId,
    name: parsed.data.name,
  });
  if (exists) throw new HttpError(409, 'A team with that name already exists');

  const team = await Team.create({ ...parsed.data, organization: req.organizationId });

  await recordAudit(req, {
    action: 'team.create',
    entityType: 'team',
    entityId: String(team._id),
    summary: `Created team ${team.name}`,
  });

  res.status(201).json(toClient(team));
});

export const updateTeam = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = teamUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }
  if (parsed.data.parent && parsed.data.parent === req.params.id) {
    throw new HttpError(400, 'A team cannot be its own parent');
  }

  const team = await Team.findOneAndUpdate(
    { _id: req.params.id, organization: req.organizationId },
    parsed.data,
    { new: true }
  );
  if (!team) throw new HttpError(404, 'Team not found');

  await recordAudit(req, {
    action: 'team.update',
    entityType: 'team',
    entityId: String(team._id),
    summary: `Updated team ${team.name}`,
  });

  res.json(toClient(team));
});

export const deleteTeam = asyncHandler<AuthRequest>(async (req, res) => {
  const team = await Team.findOneAndDelete({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!team) throw new HttpError(404, 'Team not found');

  await Promise.all([
    Team.updateMany({ parent: team._id }, { parent: null }),
    Membership.deleteMany({ scopeType: 'team', scopeId: team._id }),
  ]);

  await recordAudit(req, {
    action: 'team.delete',
    entityType: 'team',
    entityId: String(team._id),
    summary: `Deleted team ${team.name}`,
  });

  res.json({ ok: true });
});
