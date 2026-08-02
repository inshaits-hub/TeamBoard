import AuditLog from '../../models/org/auditLogModel';
import { AuthRequest } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../middleware/errorMiddleware';

export const listAuditLogs = asyncHandler<AuthRequest>(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter: Record<string, unknown> = { organization: req.organizationId };
  if (req.query.entityType) filter.entityType = req.query.entityType;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    total,
    page,
    limit,
    logs: logs.map((doc: any) => ({
      id: String(doc._id),
      actorName: doc.actorName,
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      summary: doc.summary,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
    })),
  });
});
