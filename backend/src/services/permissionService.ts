import { Types } from 'mongoose';
import Membership from '../models/org/membershipModel';
import Role, { IRole } from '../models/org/roleModel';
import Project from '../models/org/projectModel';
import Team from '../models/org/teamModel';
import Department from '../models/org/departmentModel';
import Organization from '../models/org/organizationModel';
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  type Permission,
} from '../rbac/permissions';
import type { ScopeType } from '../models/org/membershipModel';

export interface Scope {
  type: ScopeType;
  id?: string | Types.ObjectId | null;
}

export interface AccessContext {
  userId: string;
  organizationId: string;
  isOwner: boolean;
  /** Permission sets keyed by `${scopeType}:${scopeId}` (org uses `organization:*`). */
  byScope: Map<string, Set<string>>;
  roles: Array<{ key: string; name: string; scopeType: ScopeType; scopeId: string | null }>;
}

const scopeKey = (type: ScopeType, id?: string | Types.ObjectId | null) =>
  type === 'organization' ? 'organization:*' : `${type}:${String(id)}`;

/** Creates the built-in roles once; safe to call on every boot. */
export async function ensureSystemRoles(): Promise<Map<string, IRole>> {
  const result = new Map<string, IRole>();

  for (const definition of SYSTEM_ROLES) {
    const permissions =
      definition.permissions === ALL_PERMISSIONS
        ? [ALL_PERMISSIONS]
        : (definition.permissions as Permission[]);

    const role = await Role.findOneAndUpdate(
      { organization: null, key: definition.key },
      {
        organization: null,
        key: definition.key,
        name: definition.name,
        description: definition.description,
        rank: definition.rank,
        permissions,
        isSystem: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    result.set(definition.key, role as IRole);
  }

  return result;
}

export async function getSystemRole(key: string) {
  return Role.findOne({ organization: null, key });
}

/** Loads every grant a user holds inside one organization. */
export async function resolveAccess(
  userId: string,
  organizationId: string
): Promise<AccessContext> {
  const [memberships, organization] = await Promise.all([
    Membership.find({
      user: userId,
      organization: organizationId,
      status: 'active',
    }).populate<{ role: IRole }>('role'),
    Organization.findById(organizationId).select('owner'),
  ]);

  const byScope = new Map<string, Set<string>>();
  const roles: AccessContext['roles'] = [];

  for (const membership of memberships) {
    const role = membership.role as unknown as IRole | null;
    if (!role) continue;

    const key = scopeKey(membership.scopeType, membership.scopeId);
    const set = byScope.get(key) ?? new Set<string>();
    role.permissions.forEach((permission) => set.add(permission));
    byScope.set(key, set);

    roles.push({
      key: role.key,
      name: role.name,
      scopeType: membership.scopeType,
      scopeId: membership.scopeId ? String(membership.scopeId) : null,
    });
  }

  const isOwner = String(organization?.owner ?? '') === String(userId);
  if (isOwner) {
    const set = byScope.get('organization:*') ?? new Set<string>();
    set.add(ALL_PERMISSIONS);
    byScope.set('organization:*', set);
  }

  return { userId, organizationId, isOwner, byScope, roles };
}

/**
 * Builds the chain of scopes a permission check may be satisfied by.
 * Org-level grants always win; a department grant covers its projects/teams.
 */
export async function scopeChain(scope?: Scope): Promise<string[]> {
  const chain = ['organization:*'];
  if (!scope || scope.type === 'organization' || !scope.id) return chain;

  if (scope.type === 'department') {
    chain.push(scopeKey('department', scope.id));
    return chain;
  }

  if (scope.type === 'project') {
    const project = await Project.findById(scope.id).select('department');
    if (project?.department) chain.push(scopeKey('department', project.department));
    chain.push(scopeKey('project', scope.id));
    return chain;
  }

  if (scope.type === 'team') {
    const team = await Team.findById(scope.id).select('department parent');
    if (team?.department) chain.push(scopeKey('department', team.department));
    if (team?.parent) chain.push(scopeKey('team', team.parent));
    chain.push(scopeKey('team', scope.id));
    return chain;
  }

  return chain;
}

export function hasPermissionInChain(
  access: AccessContext,
  permission: Permission,
  chain: string[]
): boolean {
  return chain.some((key) => {
    const set = access.byScope.get(key);
    if (!set) return false;
    return set.has(ALL_PERMISSIONS) || set.has(permission);
  });
}

export async function can(
  access: AccessContext,
  permission: Permission,
  scope?: Scope
): Promise<boolean> {
  const chain = await scopeChain(scope);
  return hasPermissionInChain(access, permission, chain);
}

/** Flattened permission list sent to the client for UI gating. */
export function effectivePermissions(access: AccessContext) {
  const output: Record<string, string[]> = {};
  access.byScope.forEach((set, key) => {
    output[key] = Array.from(set);
  });
  return output;
}

export async function listUserOrganizations(userId: string) {
  const memberships = await Membership.find({ user: userId, status: 'active' })
    .populate('organization', 'name slug plan')
    .populate('role', 'key name');

  const seen = new Map<string, any>();
  for (const membership of memberships) {
    const org: any = membership.organization;
    if (!org?._id) continue;
    const id = String(org._id);
    if (seen.has(id)) continue;
    seen.set(id, {
      id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: (membership.role as any)?.name ?? 'Member',
      roleKey: (membership.role as any)?.key ?? 'guest',
    });
  }
  return Array.from(seen.values());
}

export async function departmentExists(orgId: string, id: string) {
  return Boolean(await Department.exists({ _id: id, organization: orgId }));
}
