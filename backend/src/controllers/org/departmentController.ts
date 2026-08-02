import Department from '../../models/org/departmentModel';
import Project from '../../models/org/projectModel';
import Team from '../../models/org/teamModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../../middleware/errorMiddleware';
import { recordAudit } from '../../services/auditService';
import {
  departmentSchema,
  departmentUpdateSchema,
} from '../../validation/orgSchemas';

const toClient = (doc: any) => ({
  id: String(doc._id),
  name: doc.name,
  description: doc.description ?? '',
  parent: doc.parent ? String(doc.parent) : null,
  head: doc.head ? String(doc.head) : null,
  createdAt: doc.createdAt,
});

export const listDepartments = asyncHandler<AuthRequest>(async (req, res) => {
  const departments = await Department.find({ organization: req.organizationId }).sort({
    name: 1,
  });

  const [projectCounts, teamCounts] = await Promise.all([
    Project.aggregate([
      { $match: { organization: departments[0]?.organization } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
    Team.aggregate([
      { $match: { organization: departments[0]?.organization } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
  ]);

  const countFor = (rows: any[], id: string) =>
    rows.find((row) => String(row._id) === id)?.count ?? 0;

  res.json({
    departments: departments.map((doc) => ({
      ...toClient(doc),
      projectCount: countFor(projectCounts, String(doc._id)),
      teamCount: countFor(teamCounts, String(doc._id)),
    })),
  });
});

export const createDepartment = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = departmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const exists = await Department.exists({
    organization: req.organizationId,
    name: parsed.data.name,
  });
  if (exists) throw new HttpError(409, 'A department with that name already exists');

  const department = await Department.create({
    ...parsed.data,
    organization: req.organizationId,
  });

  await recordAudit(req, {
    action: 'department.create',
    entityType: 'department',
    entityId: String(department._id),
    summary: `Created department ${department.name}`,
  });

  res.status(201).json(toClient(department));
});

export const updateDepartment = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = departmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  if (parsed.data.parent && parsed.data.parent === req.params.id) {
    throw new HttpError(400, 'A department cannot be its own parent');
  }

  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, organization: req.organizationId },
    parsed.data,
    { new: true }
  );
  if (!department) throw new HttpError(404, 'Department not found');

  await recordAudit(req, {
    action: 'department.update',
    entityType: 'department',
    entityId: String(department._id),
    summary: `Updated department ${department.name}`,
  });

  res.json(toClient(department));
});

export const deleteDepartment = asyncHandler<AuthRequest>(async (req, res) => {
  const department = await Department.findOneAndDelete({
    _id: req.params.id,
    organization: req.organizationId,
  });
  if (!department) throw new HttpError(404, 'Department not found');

  // Detach children rather than cascading deletes.
  await Promise.all([
    Department.updateMany({ parent: department._id }, { parent: null }),
    Project.updateMany({ department: department._id }, { department: null }),
    Team.updateMany({ department: department._id }, { department: null }),
  ]);

  await recordAudit(req, {
    action: 'department.delete',
    entityType: 'department',
    entityId: String(department._id),
    summary: `Deleted department ${department.name}`,
  });

  res.json({ ok: true });
});
