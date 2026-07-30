import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_TASKS } from "./data";
import type { ColumnId, Priority, Task } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";

export const TASKS_STORAGE_KEY = "taskboard.tasks.v1";
export const VIEW_STORAGE_KEY = "taskboard.view.v1";

export type ViewMode = "board" | "list";

/** A task removed by a delete, with the position it should return to. */
export interface RemovedTask {
  index: number;
  task: Task;
}

function isValidTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    COLUMNS.some((c) => c.id === t.column) &&
    Object.keys(PRIORITIES).includes(String(t.priority)) &&
    Object.keys(LABELS).includes(String(t.label))
  );
}

export function normalizeTask(value: unknown): Task | null {
  if (!isValidTask(value)) return null;
  const t = value as unknown as Task;
  return {
    id: t.id,
    title: t.title,
    description: typeof t.description === "string" ? t.description : "",
    column: t.column,
    priority: t.priority,
    label: t.label,
    dueDate: typeof t.dueDate === "string" ? t.dueDate : "",
    assignee: typeof t.assignee === "string" ? t.assignee : "Me",
    comments: Number.isFinite(t.comments) ? t.comments : 0,
    attachments: Number.isFinite(t.attachments) ? t.attachments : 0,
    createdAt:
      typeof t.createdAt === "string" ? t.createdAt : new Date().toISOString(),
  };
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [view, setView] = useState<ViewMode>("board");
  const [hydrated, setHydrated] = useState(false);
  const skipWrite = useRef(true);

  // Read persisted state after mount so SSR and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : parsed?.tasks;
        if (Array.isArray(list)) {
          const valid = list
            .map(normalizeTask)
            .filter((t): t is Task => t !== null);
          setTasks(valid);
        }
      }
      const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (storedView === "board" || storedView === "list") setView(storedView);
    } catch {
      // Corrupt or unavailable storage: keep the demo data.
    }
    skipWrite.current = false;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (skipWrite.current) return;
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* storage full or blocked */
    }
  }, [tasks]);

  useEffect(() => {
    if (skipWrite.current) return;
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  const saveTask = useCallback((task: Task) => {
    setTasks((prev) =>
      prev.some((t) => t.id === task.id)
        ? prev.map((t) => (t.id === task.id ? task : t))
        : [task, ...prev]
    );
  }, []);

  /** Removes tasks and returns their snapshots so a delete can be undone. */
  const removeTasks = useCallback(
    (ids: string[]): RemovedTask[] => {
      const set = new Set(ids);
      const removed: RemovedTask[] = [];
      tasks.forEach((task, index) => {
        if (set.has(task.id)) removed.push({ index, task });
      });
      setTasks((prev) => prev.filter((t) => !set.has(t.id)));
      return removed;
    },
    [tasks]
  );

  const deleteTask = useCallback(
    (id: string) => removeTasks([id]),
    [removeTasks]
  );

  const deleteTasks = useCallback(
    (ids: string[]) => removeTasks(ids),
    [removeTasks]
  );

  /** Re-inserts previously removed tasks at their original positions. */
  const restoreTasks = useCallback((entries: RemovedTask[]) => {
    if (entries.length === 0) return;
    setTasks((prev) => {
      const next = [...prev];
      [...entries]
        .sort((a, b) => a.index - b.index)
        .forEach(({ index, task }) => {
          if (next.some((t) => t.id === task.id)) return;
          next.splice(Math.min(index, next.length), 0, task);
        });
      return next;
    });
  }, []);

  const setColumnForTasks = useCallback((ids: string[], column: ColumnId) => {
    const set = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => (set.has(t.id) ? { ...t, column } : t))
    );
  }, []);

  const setPriorityForTasks = useCallback((ids: string[], priority: Priority) => {
    const set = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => (set.has(t.id) ? { ...t, priority } : t))
    );
  }, []);

  const resetTasks = useCallback(() => setTasks(INITIAL_TASKS), []);

  return {
    tasks,
    setTasks,
    view,
    setView,
    hydrated,
    saveTask,
    deleteTask,
    deleteTasks,
    restoreTasks,
    setColumnForTasks,
    setPriorityForTasks,
    resetTasks,
  };
}
