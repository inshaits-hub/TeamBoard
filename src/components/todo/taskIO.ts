import type { Task } from "./types";
import { normalizeTask } from "./useTaskStore";

export interface TaskExport {
  version: 1;
  exportedAt: string;
  tasks: Task[];
}

export function buildExport(tasks: Task[]): TaskExport {
  return { version: 1, exportedAt: new Date().toISOString(), tasks };
}

export function downloadTasks(tasks: Task[]) {
  const payload = JSON.stringify(buildExport(tasks), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `taskboard-${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ParseResult =
  | { ok: true; tasks: Task[]; skipped: number }
  | { ok: false; error: string };

export function parseTasksFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }

  const list = Array.isArray(data)
    ? data
    : (data as { tasks?: unknown })?.tasks;

  if (!Array.isArray(list)) {
    return {
      ok: false,
      error: "Expected a task list or an object with a \"tasks\" array.",
    };
  }

  const tasks: Task[] = [];
  let skipped = 0;
  for (const item of list) {
    const task = normalizeTask(item);
    if (task) tasks.push(task);
    else skipped += 1;
  }

  if (tasks.length === 0) {
    return { ok: false, error: "No valid tasks were found in that file." };
  }

  return { ok: true, tasks, skipped };
}

export function mergeTasks(existing: Task[], incoming: Task[]): Task[] {
  const ids = new Set(existing.map((t) => t.id));
  const added = incoming.map((task) => {
    if (!ids.has(task.id)) {
      ids.add(task.id);
      return task;
    }
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${task.id}-${Math.random().toString(36).slice(2, 9)}`;
    ids.add(id);
    return { ...task, id };
  });
  return [...added, ...existing];
}
