/**
 * Shared TypeScript types for the organization module.
 *
 * These mirror the shapes returned by the backend `toClient` mappers in
 * `backend/src/controllers/org/*` so the UI and API layer speak one dialect.
 */

export type OrgPlan = "free" | "team" | "business" | "enterprise";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "archived";

export type ScopeType = "organization" | "department" | "project" | "team";

export type MembershipStatus = "active" | "suspended";

export interface OrgSettings {
  timezone: string;
  weekStartsOn: number;
  requireApprovalForInvites: boolean;
  enforceMfa: boolean;
}

export interface OrgEntity {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  owner: string;
  settings: OrgSettings;
}

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  role: string;
  roleKey: string;
}

export interface ScopedRole {
  key: string;
  name: string;
  scopeType: ScopeType;
  scopeId: string | null;
}

export interface OrgCounts {
  departments: number;
  projects: number;
  teams: number;
  members: number;
}

export interface OrgContextResponse {
  organization: OrgEntity;
  organizations: UserOrganization[];
  permissions: Record<string, string[]>;
  roles: ScopedRole[];
  isOwner: boolean;
  counts: OrgCounts;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  parent: string | null;
  head: string | null;
  projectCount: number;
  teamCount: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  department: string | null;
  lead: string | null;
  startDate: string;
  targetDate: string;
  color: string;
  taskCount: number;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  department: string | null;
  parent: string | null;
  leader: string | null;
  projects: string[];
  memberCount: number;
  createdAt: string;
}

export interface RoleInfo {
  id: string;
  key: string;
  name: string;
  description: string;
  rank: number;
  permissions: string[];
  isSystem: boolean;
  memberCount: number;
}

export interface RoleCatalogue {
  permissions: string[];
  groups: Record<string, string[]>;
}

export interface RoleListResponse {
  roles: RoleInfo[];
  catalogue: RoleCatalogue;
}

export interface Member {
  /** This is the Membership document id (not the user id). */
  id: string;
  userId: string;
  name: string;
  email: string;
  role: { id: string; name: string; key: string } | null;
  scopeType: ScopeType;
  scopeId: string | null;
  reportsTo: string | null;
  title: string;
  status: MembershipStatus;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: { id: string; name: string } | null;
  scopeType: ScopeType;
  scopeId: string | null;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogPage {
  total: number;
  page: number;
  limit: number;
  logs: AuditLog[];
}

/* ----------------------------- Payload types ----------------------------- */

export interface OrganizationCreatePayload {
  name: string;
  slug?: string;
  plan?: OrgPlan;
}

export interface OrganizationUpdatePayload {
  name?: string;
  plan?: OrgPlan;
  settings?: Partial<OrgSettings>;
}

export interface DepartmentPayload {
  name: string;
  description?: string;
  parent?: string | null;
  head?: string | null;
}

export interface ProjectPayload {
  name: string;
  key: string;
  description?: string;
  status?: ProjectStatus;
  department?: string | null;
  lead?: string | null;
  startDate?: string;
  targetDate?: string;
  color?: string;
}

export interface TeamPayload {
  name: string;
  description?: string;
  department?: string | null;
  parent?: string | null;
  leader?: string | null;
  projects?: string[];
}

export interface RolePayload {
  name: string;
  description?: string;
  rank?: number;
  permissions: string[];
}

export interface MembershipUpdatePayload {
  roleId?: string;
  title?: string;
  reportsTo?: string | null;
  status?: MembershipStatus;
  scopeType?: ScopeType;
  scopeId?: string | null;
}

export interface InvitationPayload {
  email: string;
  roleId: string;
  scopeType?: ScopeType;
  scopeId?: string | null;
}

/** Project status labels for the UI. */
export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  planning: { label: "Planning", tone: "bg-amber-500/15 text-amber-600" },
  active: { label: "Active", tone: "bg-emerald-500/15 text-emerald-600" },
  "on-hold": { label: "On hold", tone: "bg-slate-500/15 text-slate-600" },
  completed: { label: "Completed", tone: "bg-indigo-500/15 text-indigo-600" },
  archived: { label: "Archived", tone: "bg-muted text-muted-foreground" },
};

export const ORG_PLANS: OrgPlan[] = ["free", "team", "business", "enterprise"];

