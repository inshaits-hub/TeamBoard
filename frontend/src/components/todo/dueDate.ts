import type { Task } from "./types";

export type DueFilter = "all" | "overdue" | "today" | "week" | "none";
export type SortMode =
  | "manual"
  | "due-asc"
  | "due-desc"
  | "priority"
  | "created";

export const DUE_FILTERS: { value: DueFilter; label: string }[] = [
  { value: "all", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
];

export const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "manual", label: "Manual order" },
  { value: "due-asc", label: "Due date — soonest" },
  { value: "due-desc", label: "Due date — latest" },
  { value: "priority", label: "Priority" },
  { value: "created", label: "Recently created" },
];

const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Parses an ISO `yyyy-mm-dd` value into a local Date at midnight. */
export function parseDue(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntilDue(value: string | undefined | null): number | null {
  const due = parseDue(value);
  if (!due) return null;
  const diff = due.getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

export type DueTone = "overdue" | "soon" | "upcoming" | "none";

export interface DueMeta {
  tone: DueTone;
  label: string;
  full: string;
  days: number | null;
}

export function getDueMeta(task: Pick<Task, "dueDate" | "column">): DueMeta {
  const due = parseDue(task.dueDate);
  if (!due) {
    return {
      tone: "none",
      label: task.dueDate?.trim() ? task.dueDate : "No due date",
      full: task.dueDate?.trim() ? task.dueDate : "No due date",
      days: null,
    };
  }

  const full = due.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: due.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
  const days = daysUntilDue(task.dueDate) ?? 0;
  const done = task.column === "done";

  let label: string;
  if (days === 0) label = "Due today";
  else if (days === 1) label = "Due tomorrow";
  else if (days === -1) label = "1 day overdue";
  else if (days < -1) label = `${Math.abs(days)} days overdue`;
  else if (days <= 7) label = `Due in ${days} days`;
  else label = full;

  let tone: DueTone = "upcoming";
  if (done) tone = "upcoming";
  else if (days < 0) tone = "overdue";
  else if (days <= 2) tone = "soon";

  return { tone, label, full, days };
}

export const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-destructive/10 text-destructive",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  upcoming: "bg-app-muted text-muted-foreground",
  none: "bg-transparent text-muted-foreground",
};

export function matchesDueFilter(task: Task, filter: DueFilter): boolean {
  if (filter === "all") return true;
  const days = daysUntilDue(task.dueDate);
  if (filter === "none") return days === null;
  if (days === null) return false;
  if (filter === "overdue") return days < 0 && task.column !== "done";
  if (filter === "today") return days === 0;
  if (filter === "week") return days >= 0 && days <= 7;
  return true;
}

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  if (mode === "manual") return tasks;
  const list = [...tasks];

  const dueValue = (t: Task) => {
    const d = parseDue(t.dueDate);
    return d ? d.getTime() : null;
  };

  list.sort((a, b) => {
    switch (mode) {
      case "due-asc":
      case "due-desc": {
        const av = dueValue(a);
        const bv = dueValue(b);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return mode === "due-asc" ? av - bv : bv - av;
      }
      case "priority":
        return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return 0;
    }
  });

  return list;
}
