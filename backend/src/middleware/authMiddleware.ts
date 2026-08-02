import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/userModel';
import Membership from '../models/org/membershipModel';
import {
  resolveAccess,
  scopeChain,
  hasPermissionInChain,
  type AccessContext,
  type Scope,
} from '../services/permissionService';
import type { Permission } from '../rbac/permissions';
import { HttpError } from './errorMiddleware';

export interface AuthRequest extends Request {
  userId?: string;
  actorName?: string;
  organizationId?: string;
  access?: AccessContext;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Resolves the active organization (from `x-organization-id`, falling back to
 * the user's first membership) and loads the caller's permission grants.
 */
export const withOrganization = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) throw new HttpError(401, 'Not authenticated');

    const headerOrg =
      (req.headers['x-organization-id'] as string | undefined) ||
      (req.query.organizationId as string | undefined);

    let organizationId = headerOrg?.trim();

    if (organizationId) {
      const membership = await Membership.exists({
        user: req.userId,
        organization: organizationId,
        status: 'active',
      });
      if (!membership) throw new HttpError(403, 'You are not a member of this organization');
    } else {
      const first = await Membership.findOne({
        user: req.userId,
        status: 'active',
      }).sort({ createdAt: 1 });
      if (!first) throw new HttpError(404, 'No organization found for this account');
      organizationId = String(first.organization);
    }

    const user = await User.findById(req.userId).select('name');
    req.actorName = user?.name ?? '';
    req.organizationId = organizationId;
    req.access = await resolveAccess(req.userId, organizationId);
    next();
  } catch (error) {
    next(error);
  }
};

type ScopeResolver = (req: AuthRequest) => Scope | undefined;

/**
 * Guards a route behind a permission, optionally within a narrower scope.
 * Must run after `protect` and `withOrganization`.
 */
export const requirePermission =
  (permission: Permission, resolveScope?: ScopeResolver) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.access) throw new HttpError(500, 'Organization context missing');
      const chain = await scopeChain(resolveScope?.(req));
      if (!hasPermissionInChain(req.access, permission, chain)) {
        throw new HttpError(403, `Missing permission: ${permission}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
