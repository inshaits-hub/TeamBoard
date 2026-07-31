import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Task } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";
import { DUE_TONE_CLASS, getDueMeta } from "./dueDate";

interface TaskPreviewSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskPreviewSheet({
  task,
  open,
  onOpenChange,
  onEdit,
  onToggleComplete,
  onDelete,
}: TaskPreviewSheetProps) {
  if (!task) return null;

  const label = LABELS[task.label];
  const priority = PRIORITIES[task.priority];
  const column = COLUMNS.find((c) => c.id === task.column);
  const due = getDueMeta(task);
  const isDone = task.column === "done";

  const created = new Date(task.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="border-border/50 bg-app-card"
        aria-label={`Preview of task ${task.title}`}
        onKeyDown={(event) => {
          if (event.target instanceof HTMLElement) {
            const tag = event.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
          }
          const key = event.key.toLowerCase();
          if (key === "e") {
            event.preventDefault();
            onEdit(task);
          } else if (key === "c") {
            event.preventDefault();
            onToggleComplete(task);
          } else if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onDelete(task);
          }
        }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader className="gap-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={`${label.bg} ${label.text} rounded-full px-3 py-0.5 text-[11px] font-medium`}
              >
                {label.name}
              </Badge>
              <Badge
                variant="secondary"
                className={`${priority.color} rounded-full border-0 px-3 py-0.5 text-[11px] font-medium`}
              >
                {priority.name} priority
              </Badge>
              <Badge
                variant="secondary"
                className={`${DUE_TONE_CLASS[due.tone]} gap-1 rounded-full border-0 px-3 py-0.5 text-[11px] font-medium`}
              >
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                {due.label}
              </Badge>
            </div>

            <DrawerTitle
              className={`text-xl font-semibold leading-snug text-app-card-foreground ${
                isDone ? "line-through opacity-70" : ""
              }`}
            >
              {task.title}
            </DrawerTitle>
            <DrawerDescription className="text-sm leading-relaxed text-muted-foreground">
              {task.description?.trim()
                ? task.description
                : "No description for this task yet."}
            </DrawerDescription>
          </DrawerHeader>

          <Separator className="bg-border/50" />

          <dl className="grid grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Status
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-app-card-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${column?.color ?? "bg-slate-400"}`}
                  aria-hidden="true"
                />
                {column?.title ?? task.column}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Due date
              </dt>
              <dd className="mt-1 text-sm font-medium text-app-card-foreground">
                {due.full}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Assignee
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-app-card-foreground">
                <Avatar className="h-6 w-6 text-[10px] ring-2 ring-app-primary/20">
                  <AvatarFallback className="bg-app-primary text-app-primary-foreground">
                    {task.assignee}
                  </AvatarFallback>
                </Avatar>
                {task.assignee}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Activity
              </dt>
              <dd className="mt-1 flex items-center gap-3 text-sm font-medium text-app-card-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  {task.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {task.attachments}
                </span>
              </dd>
            </div>
          </dl>

          <p className="flex items-center gap-1.5 px-4 pb-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Created {created}
          </p>

          <DrawerFooter className="flex-row flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              className="flex-1 rounded-xl bg-app-primary text-app-primary-foreground hover:bg-app-primary/90"
              onClick={() => onToggleComplete(task)}
            >
              {isDone ? (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isDone ? "Reopen" : "Complete"}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
