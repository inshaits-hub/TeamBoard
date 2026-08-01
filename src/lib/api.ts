import type { Task } from "@/components/todo/types";

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
