import type { Task } from "@/components/todo/types";
import type {
  AuditLogPage,
  Department,
  DepartmentPayload,
  Invitation,
  InvitationPayload,
  Member,
  MembershipUpdatePayload,
  OrgContextResponse,
  OrgEntity,
  OrganizationCreatePayload,
  OrganizationUpdatePayload,
  Project,
  ProjectPayload,
  RoleInfo,
  RoleListResponse,
  RolePayload,
  Team,
  TeamPayload,
  UserOrganization,
} from "./orgTypes";

/**
 * Base URL of the Express API, e.g. https://teamboard-api.onrender.com/api
 * When unset the app runs fully offline against localStorage.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  ""
);

export const isBackendConfigured = Boolean(API_URL);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  if (!API_URL) throw new ApiError(0, "No API URL configured");

  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Request failed");
  }
  return data as T;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface TeamMemberResponse {
  members: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

export interface OrgInfoResponse {
  organization: string;
  memberCount: number;
  role: string;
}

export const authApi = {
  register: (name: string, email: string, password: string, organization: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, organization }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) => request<ApiUser>("/auth/me", { token }),

  createMember: (token: string, name: string, email: string, password: string) =>
    request<{ id: string; name: string; email: string; role: string }>("/auth/members", {
      method: "POST",
      token,
      body: JSON.stringify({ name, email, password }),
    }),

  listMembers: (token: string) =>
    request<TeamMemberResponse>("/auth/members", { token }),

  deleteMember: (token: string, id: string) =>
    request<{ ok: boolean }>(`/auth/members/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),

  getOrgInfo: (token: string) =>
    request<OrgInfoResponse>("/auth/org-info", { token }),
};

export interface TaskSyncPayload {
  tasks: Task[];
  boardOrder: string[];
  listOrder: string[];
}

/** The server stores the client-side id under `clientId`. */
const toServerTask = (task: Task) => ({
  clientId: task.id,
  title: task.title,
  description: task.description ?? "",
  column: task.column,
  priority: task.priority,
  label: task.label,
  severity: task.severity ?? "minor",
  reviewer: task.reviewer ?? "",
  storyPoints: task.storyPoints ?? 0,
  estimatedEffort: task.estimatedEffort ?? 0,
  dependencies: task.dependencies ?? [],
  subtasks: task.subtasks ?? [],
  checklist: task.checklist ?? [],
  recurrence: task.recurrence ?? { frequency: "none", interval: 1, endsOn: "" },
  createdBy: task.createdBy ?? "",
  dueDate: /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate ?? "") ? task.dueDate : "",
  assignee: task.assignee ?? "Me",
  comments: task.comments ?? 0,
  attachments: task.attachments ?? 0,
  createdAtISO: task.createdAt ?? new Date().toISOString(),
});

export const tasksApi = {
  list: (token: string) => request<TaskSyncPayload>("/tasks", { token }),

  upsert: (token: string, task: Task) =>
    request<Task>("/tasks", {
      method: "POST",
      token,
      body: JSON.stringify(toServerTask(task)),
    }),

  remove: (token: string, id: string) =>
    request<{ ok: true }>(`/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),

  bulk: (
    token: string,
    payload: {
      ids: string[];
      action: "column" | "priority" | "delete";
      column?: Task["column"];
      priority?: Task["priority"];
    }
  ) =>
    request<{ ok: true }>("/tasks/bulk", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  saveOrder: (
    token: string,
    order: { boardOrder?: string[]; listOrder?: string[] }
  ) =>
    request<{ ok: true }>("/tasks/order", {
      method: "PUT",
      token,
      body: JSON.stringify(order),
    }),

  replaceAll: (token: string, payload: TaskSyncPayload) =>
    request<TaskSyncPayload>("/tasks/replace", {
      method: "PUT",
      token,
      body: JSON.stringify({
        tasks: payload.tasks.map(toServerTask),
        boardOrder: payload.boardOrder,
        listOrder: payload.listOrder,
      }),
    }),
};

const TOKEN_KEY = "todo-auth-token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage blocked */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage blocked */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Organization API — mirrors backend/src/routes/orgRoutes.ts          */
/* ------------------------------------------------------------------ */

const orgPath = (path: string) => `/org${path}`;

/**
 * Helper that picks the active organization header. When no id is provided
 * the backend falls back to the caller's first (or only) membership.
 */
function orgHeaders(token: string, organizationId?: string): Record<string, string> {
  return organizationId ? { "x-organization-id": organizationId } : {};
}

export const orgApi = {
  /* Context & organizations */
  listOrganizations: (token: string) =>
    request<{ organizations: UserOrganization[] }>(orgPath("/organizations"), { token }),

  createOrganization: (token: string, payload: OrganizationCreatePayload) =>
    request<OrgEntity>(orgPath("/organizations"), {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  getContext: (token: string, organizationId?: string) =>
    request<OrgContextResponse>(orgPath("/context"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  updateOrganization: (
    token: string,
    payload: OrganizationUpdatePayload,
    organizationId?: string
  ) =>
    request<OrgEntity>(orgPath("/organization"), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  deleteOrganization: (token: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath("/organization"), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Departments */
  listDepartments: (token: string, organizationId?: string) =>
    request<{ departments: Department[] }>(orgPath("/departments"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  createDepartment: (
    token: string,
    payload: DepartmentPayload,
    organizationId?: string
  ) =>
    request<Department>(orgPath("/departments"), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  updateDepartment: (
    token: string,
    id: string,
    payload: Partial<DepartmentPayload>,
    organizationId?: string
  ) =>
    request<Department>(orgPath(`/departments/${encodeURIComponent(id)}`), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/departments/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Projects */
  listProjects: (token: string, organizationId?: string) =>
    request<{ projects: Project[] }>(orgPath("/projects"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  createProject: (token: string, payload: ProjectPayload, organizationId?: string) =>
    request<Project>(orgPath("/projects"), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  updateProject: (
    token: string,
    id: string,
    payload: Partial<ProjectPayload>,
    organizationId?: string
  ) =>
    request<Project>(orgPath(`/projects/${encodeURIComponent(id)}`), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  deleteProject: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/projects/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Teams */
  listTeams: (token: string, organizationId?: string) =>
    request<{ teams: Team[] }>(orgPath("/teams"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  createTeam: (token: string, payload: TeamPayload, organizationId?: string) =>
    request<Team>(orgPath("/teams"), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  updateTeam: (
    token: string,
    id: string,
    payload: Partial<TeamPayload>,
    organizationId?: string
  ) =>
    request<Team>(orgPath(`/teams/${encodeURIComponent(id)}`), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  deleteTeam: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/teams/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Roles */
  listRoles: (token: string, organizationId?: string) =>
    request<RoleListResponse>(orgPath("/roles"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  createRole: (token: string, payload: RolePayload, organizationId?: string) =>
    request<RoleInfo>(orgPath("/roles"), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  updateRole: (
    token: string,
    id: string,
    payload: Partial<RolePayload>,
    organizationId?: string
  ) =>
    request<RoleInfo>(orgPath(`/roles/${encodeURIComponent(id)}`), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  deleteRole: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/roles/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Members & memberships */
  listMembers: (token: string, organizationId?: string) =>
    request<{ members: Member[] }>(orgPath("/members"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  updateMembership: (
    token: string,
    id: string,
    payload: MembershipUpdatePayload,
    organizationId?: string
  ) =>
    request<Member>(orgPath(`/members/${encodeURIComponent(id)}`), {
      method: "PATCH",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  removeMembership: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/members/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  grantScopedRole: (
    token: string,
    userId: string,
    payload: MembershipUpdatePayload,
    organizationId?: string
  ) =>
    request<Member>(orgPath(`/members/${encodeURIComponent(userId)}/grants`), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  /* Invitations */
  listInvitations: (token: string, organizationId?: string) =>
    request<{ invitations: Invitation[] }>(orgPath("/invitations"), {
      token,
      headers: orgHeaders(token, organizationId),
    }),

  createInvitation: (
    token: string,
    payload: InvitationPayload,
    organizationId?: string
  ) =>
    request<Invitation>(orgPath("/invitations"), {
      method: "POST",
      token,
      headers: orgHeaders(token, organizationId),
      body: JSON.stringify(payload),
    }),

  revokeInvitation: (token: string, id: string, organizationId?: string) =>
    request<{ ok: boolean }>(orgPath(`/invitations/${encodeURIComponent(id)}`), {
      method: "DELETE",
      token,
      headers: orgHeaders(token, organizationId),
    }),

  /* Audit logs */
  listAuditLogs: (
    token: string,
    organizationId?: string,
    options?: { page?: number; limit?: number; entityType?: string }
  ) => {
    const params = new URLSearchParams();
    if (options?.page) params.set("page", String(options.page));
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.entityType) params.set("entityType", options.entityType);
    const qs = params.toString();
    return request<AuditLogPage>(orgPath(`/audit-logs${qs ? `?${qs}` : ""}`), {
      token,
      headers: orgHeaders(token, organizationId),
    });
  },
};
