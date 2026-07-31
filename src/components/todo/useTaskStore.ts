import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_TASKS } from "./data";
import type { ColumnId, Priority, Task } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";
import { isBackendConfigured, tasksApi } from "@/lib/api";

export const TASKS_STORAGE_KEY = "taskboard.tasks.v1";
export const VIEW_STORAGE_KEY = "taskboard.view.v1";
export const ORDER_STORAGE_KEY = "taskboard.order.v1";

export type ViewMode = "board" | "list" | "calendar";

/** Views that own an independent manual ordering. */
export type OrderScope = "board" | "list";

/** A task removed by a delete, with the position it should return to. */
export interface RemovedTask {
  index: number;
  task: Task;
}

export interface TaskOrder {
  board: string[];
  list: string[];
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

/**
 * Drops ids of deleted tasks and appends ids that have never been ordered,
 * so a saved order stays valid as tasks come and go.
 */
export function reconcileOrder(order: string[], tasks: Task[]): string[] {
  const known = new Set(tasks.map((t) => t.id));
  const kept = order.filter((id) => known.has(id));
  const seen = new Set(kept);
  const fresh = tasks.filter((t) => !seen.has(t.id)).map((t) => t.id);
  // Newly created tasks appear at the top, matching how they are added.
  return [...fresh, ...kept];
}

/** Sorts tasks by a saved id order; unknown ids keep their relative position. */
export function applyOrder(tasks: Task[], order: string[]): Task[] {
  if (order.length === 0) return tasks;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...tasks].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra === undefined && rb === undefined) return 0;
    if (ra === undefined) return -1;
    if (rb === undefined) return 1;
    return ra - rb;
  });
}

/** Moves `activeId` to sit where `overId` currently is. */
export function moveInOrder(
  order: string[],
  activeId: string,
  overId: string
): string[] {
  const from = order.indexOf(activeId);
  const to = order.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, activeId);
  return next;
}

function readStoredOrder(): TaskOrder {
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return { board: [], list: [] };
    const parsed = JSON.parse(raw) as Partial<TaskOrder>;
    return {
      board: Array.isArray(parsed.board) ? parsed.board.filter((v) => typeof v === "string") : [],
      list: Array.isArray(parsed.list) ? parsed.list.filter((v) => typeof v === "string") : [],
    };
  } catch {
    return { board: [], list: [] };
  }
}

export function useTaskStore(token: string | null) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [order, setOrder] = useState<TaskOrder>({ board: [], list: [] });
  const [view, setView] = useState<ViewMode>("board");
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipWrite = useRef(true);

  const online = isBackendConfigured && Boolean(token);

  /** Fire-and-forget server write; failure degrades to local-only mode. */
  const push = useCallback(
    (run: (t: string) => Promise<unknown>) => {
      if (!online || !token) return;
      run(token).catch((err: Error) => setSyncError(err.message));
    },
    [online, token]
  );

  // Load persisted state after mount, preferring the server when signed in.
  useEffect(() => {
    let cancelled = false;

    const loadLocal = () => {
      let localTasks = INITIAL_TASKS;
      try {
        const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : parsed?.tasks;
          if (Array.isArray(list)) {
            localTasks = list
              .map(normalizeTask)
              .filter((t): t is Task => t !== null);
          }
        }
        const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
        if (storedView === "board" || storedView === "list" || storedView === "calendar") {
          setView(storedView);
        }
      } catch {
        // Corrupt or unavailable storage: keep the demo data.
      }
      const stored = readStoredOrder();
      setTasks(localTasks);
      setOrder({
        board: reconcileOrder(stored.board, localTasks),
        list: reconcileOrder(stored.list, localTasks),
      });
      return localTasks;
    };

    const finish = () => {
      if (cancelled) return;
      skipWrite.current = false;
      setHydrated(true);
      setSyncing(false);
    };

    const localTasks = loadLocal();

    if (!isBackendConfigured || !token) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    setSyncing(true);
    tasksApi
      .list(token)
      .then(async (payload) => {
        if (cancelled) return;
        const valid = payload.tasks
          .map(normalizeTask)
          .filter((t): t is Task => t !== null);

        // First sign-in on a device with local work: seed the server with it.
        if (valid.length === 0 && localTasks.length > 0) {
          const seeded = await tasksApi.replaceAll(token, {
            tasks: localTasks,
            boardOrder: reconcileOrder([], localTasks),
            listOrder: reconcileOrder([], localTasks),
          });
          if (cancelled) return;
          const seededTasks = seeded.tasks
            .map(normalizeTask)
            .filter((t): t is Task => t !== null);
          setTasks(seededTasks);
          setOrder({
            board: reconcileOrder(seeded.boardOrder ?? [], seededTasks),
            list: reconcileOrder(seeded.listOrder ?? [], seededTasks),
          });
          return;
        }

        setTasks(valid);
        setOrder({
          board: reconcileOrder(payload.boardOrder ?? [], valid),
          list: reconcileOrder(payload.listOrder ?? [], valid),
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setSyncError(err.message);
      })
      .finally(finish);

    return () => {
      cancelled = true;
    };
  }, [token]);

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
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch {
      /* ignore */
    }
  }, [order]);

  useEffect(() => {
    if (skipWrite.current) return;
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  const saveTask = useCallback(
    (task: Task) => {
      setTasks((prev) =>
        prev.some((t) => t.id === task.id)
          ? prev.map((t) => (t.id === task.id ? task : t))
          : [task, ...prev]
      );
      setOrder((prev) => ({
        board: prev.board.includes(task.id) ? prev.board : [task.id, ...prev.board],
        list: prev.list.includes(task.id) ? prev.list : [task.id, ...prev.list],
      }));
      push((t) => tasksApi.upsert(t, task));
    },
    [push]
  );

  /** Removes tasks and returns their snapshots so a delete can be undone. */
  const removeTasks = useCallback(
    (ids: string[]): RemovedTask[] => {
      const set = new Set(ids);
      const removed: RemovedTask[] = [];
      tasks.forEach((task, index) => {
        if (set.has(task.id)) removed.push({ index, task });
      });
      setTasks((prev) => prev.filter((t) => !set.has(t.id)));
      setOrder((prev) => ({
        board: prev.board.filter((id) => !set.has(id)),
        list: prev.list.filter((id) => !set.has(id)),
      }));
      return removed;
    },
    [tasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const removed = removeTasks([id]);
      push((t) => tasksApi.remove(t, id));
      return removed;
    },
    [removeTasks, push]
  );

  const deleteTasks = useCallback(
    (ids: string[]) => {
      const removed = removeTasks(ids);
      push((t) => tasksApi.bulk(t, { ids, action: "delete" }));
      return removed;
    },
    [removeTasks, push]
  );

  /** Re-inserts previously removed tasks at their original positions. */
  const restoreTasks = useCallback(
    (entries: RemovedTask[]) => {
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
      setOrder((prev) => {
        const ids = entries.map((e) => e.task.id);
        const add = (list: string[]) => [
          ...ids.filter((id) => !list.includes(id)),
          ...list,
        ];
        return { board: add(prev.board), list: add(prev.list) };
      });
      entries.forEach(({ task }) => push((t) => tasksApi.upsert(t, task)));
    },
    [push]
  );

  const setColumnForTasks = useCallback(
    (ids: string[], column: ColumnId) => {
      const set = new Set(ids);
      setTasks((prev) => prev.map((t) => (set.has(t.id) ? { ...t, column } : t)));
      push((t) => tasksApi.bulk(t, { ids, action: "column", column }));
    },
    [push]
  );

  const setPriorityForTasks = useCallback(
    (ids: string[], priority: Priority) => {
      const set = new Set(ids);
      setTasks((prev) =>
        prev.map((t) => (set.has(t.id) ? { ...t, priority } : t))
      );
      push((t) => tasksApi.bulk(t, { ids, action: "priority", priority }));
    },
    [push]
  );

  /** Persists a drag reorder for a single view. */
  const reorderTasks = useCallback(
    (scope: OrderScope, activeId: string, overId: string) => {
      setOrder((prev) => {
        const current = reconcileOrder(prev[scope], tasks);
        const next = moveInOrder(current, activeId, overId);
        push((t) =>
          tasksApi.saveOrder(t,
            scope === "board" ? { boardOrder: next } : { listOrder: next }
          )
        );
        return { ...prev, [scope]: next };
      });
    },
    [tasks, push]
  );

  const replaceAll = useCallback(
    (nextTasks: Task[], nextOrder?: Partial<TaskOrder>) => {
      const board = reconcileOrder(nextOrder?.board ?? [], nextTasks);
      const list = reconcileOrder(nextOrder?.list ?? [], nextTasks);
      setTasks(nextTasks);
      setOrder({ board, list });
      push((t) =>
        tasksApi.replaceAll(t, {
          tasks: nextTasks,
          boardOrder: board,
          listOrder: list,
        })
      );
    },
    [push]
  );

  const resetTasks = useCallback(
    () => replaceAll(INITIAL_TASKS),
    [replaceAll]
  );

  return {
    tasks,
    setTasks,
    order,
    view,
    setView,
    hydrated,
    syncing,
    syncError,
    online,
    saveTask,
    deleteTask,
    deleteTasks,
    restoreTasks,
    setColumnForTasks,
    setPriorityForTasks,
    reorderTasks,
    replaceAll,
    resetTasks,
  };
}
