/**
 * Frontend permission catalogue.
 *
 * Mirrors `backend/src/rbac/permissions.ts`. The server is always the
 * authority — this module only drives UI visibility (hiding sidebar items,
 * buttons, routes) so users never see controls they can't use.
 */

/** The three front-end roles used for navigation gating. */
export type Role = "admin" | "team_leader" | "member";

export const ROLES: readonly Role[] = ["admin", "team_leader", "member"];

export const PERMISSIONS = [
  // Organization settings
  "org:view",
  "org:update",
  "org:delete",
  "org:billing",
  "org:security",

  // Departments
  "department:view",
  "department:create",
  "department:update",
  "department:delete",

  // Teams
  "team:view",
  "team:create",
  "team:update",
  "team:delete",

  // Custom roles & RBAC
  "role:view",
  "role:create",
  "role:update",
  "role:delete",

  // Members & invitations
  "member:view",
  "member:invite",
  "member:update",
  "member:remove",
  "member:assign_role",

  // Organization-wide analytics
  "analytics:view",
  "analytics:manage",

  // Workflows & automation
  "automation:view",
  "automation:manage",

  // Security policies & integrations
  "integration:view",
  "integration:manage",

  // Projects
  "project:view",
  "project:create",
  "project:update",
  "project:delete",
  "project:archive",

  // Sprints & milestones
  "sprint:view",
  "sprint:create",
  "sprint:update",
  "milestone:view",
  "milestone:create",
  "milestone:update",

  // Task execution
  "task:view",
  "task:create",
  "task:update",
  "task:delete",
  "task:assign",
  "task:comment",
  "task:accept",
  "task:update_status",
  "task:log_hours",
  "task:upload_files",
  "task:report_blocker",
  "task:submit_deliverable",

  // Audit & compliance
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Maps the three front-end roles to the capabilities they may see and use.
 * Admin is the only role with full access; Team Leader manages their own
 * team; Member has execution-level access.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  team_leader: [
    // Own team
    "team:view",
    "team:create",
    "team:update",
    // Members of their own team
    "member:view",
    "member:invite",
    "member:update",
    "member:remove",
    // Projects / delivery
    "project:view",
    "project:create",
    "project:update",
    // Task tickets
    "task:view",
    "task:create",
    "task:update",
    "task:delete",
    "task:assign",
    "task:comment",
    // Sprints & milestones
    "sprint:view",
    "sprint:create",
    "sprint:update",
    "milestone:view",
    "milestone:create",
    "milestone:update",
    // Team analytics / velocity
    "analytics:view",
    "automation:view",
    "org:view",
  ],
  member: [
    "org:view",
    "team:view",
    "project:view",
    "task:view",
    "task:create",
    "task:update",
    "task:comment",
    "task:accept",
    "task:update_status",
    "task:log_hours",
    "task:upload_files",
    "task:report_blocker",
    "task:submit_deliverable",
  ],
};

/**
 * Normalizes a raw role value (from the JWT / API / local fallback) to one of
 * the three front-end roles. Unknown roles are treated as "member".
 */
export function normalizeRole(role: string | null | undefined): Role {
  if (!role) return "member";
  switch (role.toLowerCase().replace(/\s+/g, "_")) {
    case "admin":
    case "super_admin":
    case "org_admin":
    case "organization_admin":
      return "admin";
    case "team_leader":
    case "project_manager":
      return "team_leader";
    default:
      return "member";
  }
}

/** Returns true when the given role holds the permission. */
export function hasPermission(
  role: Role | string | null | undefined,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

