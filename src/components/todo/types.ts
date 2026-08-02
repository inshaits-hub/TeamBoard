export type Priority = "low" | "medium" | "high";

export type Severity = "trivial" | "minor" | "major" | "critical" | "blocker";

export const SEVERITIES: Record<Severity, { name: string; color: string }> = {
  trivial: { name: "Trivial", color: "bg-slate-100 text-slate-500" },
  minor: { name: "Minor", color: "bg-blue-100 text-blue-600" },
  major: { name: "Major", color: "bg-amber-100 text-amber-700" },
  critical: { name: "Critical", color: "bg-orange-100 text-orange-700" },
  blocker: { name: "Blocker", color: "bg-rose-100 text-rose-700" },
};

export type LabelType = "copywriting" | "design" | "illustration" | "research";

export type ColumnId = "todo" | "in-progress" | "review" | "done";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Recurrence {
  frequency: "daily" | "weekly" | "monthly" | "none";
  interval: number;
  endsOn: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  priority: Priority;
  label: LabelType;
  severity: Severity;
  reviewer: string;
  storyPoints: number;
  estimatedEffort: number;
  dependencies: string[];
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  recurrence: Recurrence;
  createdBy: string;
  dueDate: string;
  assignee: string;
  comments: number;
  attachments: number;
  createdAt: string;
}

export interface ColumnDef {
  id: ColumnId;
  title: string;
  color: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: "todo", title: "Task Ready", color: "bg-slate-400" },
  { id: "in-progress", title: "On Progress", color: "bg-indigo-400" },
  { id: "review", title: "Needs Review", color: "bg-amber-400" },
  { id: "done", title: "Done", color: "bg-emerald-400" },
];

export const LABELS: Record<
  LabelType,
  { name: string; bg: string; text: string }
> = {
  copywriting: {
    name: "Copywriting",
    bg: "bg-label-copywriting",
    text: "text-label-copywriting-foreground",
  },
  design: {
    name: "UI Design",
    bg: "bg-label-design",
    text: "text-label-design-foreground",
  },
  illustration: {
    name: "Illustration",
    bg: "bg-label-illustration",
    text: "text-label-illustration-foreground",
  },
  research: {
    name: "Research",
    bg: "bg-label-research",
    text: "text-label-research-foreground",
  },
};

export const PRIORITIES: Record<
  Priority,
  { name: string; color: string }
> = {
  low: { name: "Low", color: "bg-slate-200 text-slate-600" },
  medium: { name: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { name: "High", color: "bg-rose-100 text-rose-700" },
};
