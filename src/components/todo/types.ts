export type Priority = "low" | "medium" | "high";

export type LabelType = "copywriting" | "design" | "illustration" | "research";

export type ColumnId = "todo" | "in-progress" | "review" | "done" | "paused";

export interface Task {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  priority: Priority;
  label: LabelType;
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
  { id: "todo", title: "Task Ready", color: "bg-[#F3ECDA]" },
  { id: "in-progress", title: "On Progress", color: "bg-[#8C9B5C]" },
  { id: "review", title: "Needs Review", color: "bg-[#C9A227]" },
  { id: "done", title: "Done", color: "bg-[#3D5A33]" },
  { id: "paused", title: "Paused", color: "bg-[#8B5A2B]" },
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
  low: { name: "Low", color: "bg-[#B7C9AA]/50 text-[#3D5A33]" },
  medium: { name: "Medium", color: "bg-[#C9A227]/25 text-[#8B5A2B]" },
  high: { name: "High", color: "bg-[#8B5A2B]/25 text-[#8B5A2B]" },
};