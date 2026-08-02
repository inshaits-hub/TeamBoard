import Project from '../../models/org/projectModel';
import Team from '../../models/org/teamModel';
import Task from '../../models/taskModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import { projectSchema, projectUpdateSchema } from '../../validation/orgSchemas';

const toClient = (doc: any, taskCount = 0) => ({
  id: String(doc._id),
  name: doc.name,
  key: doc.key,
  description: doc.description ?? '',
  status: doc.status,
  department: doc.department ? String(doc.department) : null,
  lead: doc.lead ? String(doc.lead) : null,
  startDate: doc.startDate ?? '',
  targetDate: doc.targetDate ?? '',
  color: doc.color ?? 'violet',
  taskCount,
  createdAt: doc.createdAt,
});

export const listProjects = asyncHandler<AuthRequest>(async (req, res) => {
  const projects = await Project.find({ organization: req.organizationId }).sort({
    createdAt: -1,
  });

  const counts = await Task.aggregate([
    { $match: { organization: projects[0]?.organization } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);

  res.json({
    projects: projects.map((doc) =>
      toClient(
        doc,
        counts.find((row) => String(row._id) === String(doc._id))?.count ?? 0
      )
    ),
  });
});

export const createProject = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const exists = await Project.exists({
    organization: req.organizationId,
    key: parsed.data.key,
  });
  if (exists) throw new HttpError(409, `Project key ${parsed.data.key} is already in use`);

  const project = await Project.create({
    ...parsed.data,
    organization: req.organizationId,
  });

  await recordAudit(req, {
    action: 'project.create',
    entityType: 'project',
    entityId: String(project._id),
    summary: `Created project ${project.name} (${project.key})`,
  });

  res.status(201).json(toClient(project));
});

export const updateProject = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = projectUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, organization: req.organizationId },
    parsed.data,
    { new: true }
  );
  if (!project) throw new HttpError(404, 'Project not found');

  await recordAudit(req, {
    action: 'project.update',
    entityType: 'project',
    entityId: String(project._id),
    summary: `Updated project ${project.name}`,
    metadata: parsed.data,
  });

  res.json(toClient(project));
});

export const deleteProject = asyncHandler<AuthRequest>(async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!project) throw new HttpError(404, 'Project not found');

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Team.updateMany({ projects: project._id }, { $pull: { projects: project._id } }),
  ]);

  await recordAudit(req, {
    action: 'project.delete',
    entityType: 'project',
    entityId: String(project._id),
    summary: `Deleted project ${project.name}`,
  });

  res.json({ ok: true });
});
