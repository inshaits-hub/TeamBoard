import AuditLog from '../models/org/auditLogModel';
import type { AuthRequest } from '../middleware/authMiddleware';

interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an audit entry. Never throws — auditing must not break a request.
 */
export async function recordAudit(req: AuthRequest, input: AuditInput) {
  try {
    await AuditLog.create({
      organization: req.organizationId ?? null,
      actor: req.userId ?? null,
      actorName: req.actorName ?? '',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? '',
      summary: input.summary ?? '',
      metadata: input.metadata ?? {},
      ip: req.ip ?? '',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
