import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Paperclip, MoreHorizontal, GripVertical, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";
import { DUE_TONE_CLASS, getDueMeta } from "./dueDate";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onOpen?: (task: Task) => void;
  isOverlay?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onOpen,
  isOverlay,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: selectionMode || isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = LABELS[task.label];
  const priority = PRIORITIES[task.priority];
  const columnTitle = COLUMNS.find((c) => c.id === task.column)?.title ?? task.column;
  const due = getDueMeta(task);

  const dragProps = selectionMode || isOverlay ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      data-lovable-todo-card={task.id}
      data-task-card={task.id}
      data-column={task.column}
      style={style}
      tabIndex={isOverlay ? -1 : 0}
      role="button"
      aria-roledescription="Draggable task"
      aria-pressed={selectionMode ? selected : undefined}
      aria-label={`${task.title}. ${label.name}, ${priority.name} priority, ${columnTitle}, ${due.label}. Press Enter to preview.`}
      className={`
        group relative overflow-hidden rounded-2xl border bg-app-card p-4 shadow-sm transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-2
        ${selectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
        ${selected ? "border-app-primary ring-1 ring-app-primary" : "border-border/50"}
        ${isDragging ? "opacity-30" : "opacity-100"}
        ${isOverlay ? "rotate-2 shadow-2xl" : ""}
      `}
      onClick={() => {
        if (selectionMode) onToggleSelect?.(task.id);
        else onOpen?.(task);
      }}
      {...dragProps}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${
          due.tone === "overdue"
            ? "bg-destructive/70"
            : due.tone === "soon"
              ? "bg-amber-400"
              : "bg-app-primary/30"
        } opacity-0 transition-opacity group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {selectionMode && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(task.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select task ${task.title}`}
              tabIndex={-1}
            />
          )}
          <Badge
            variant="secondary"
            className={`${label.bg} ${label.text} rounded-full px-2.5 py-0.5 text-[10px] font-medium hover:${label.bg}`}
          >
            {label.name}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {!selectionMode && (
            <span
              className="drag-handle grid h-6 w-6 place-items-center text-muted-foreground"
              aria-hidden="true"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label={`Edit task ${task.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-app-card-foreground">
        {task.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Comments:</span>
            {task.comments}
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Attachments:</span>
            {task.attachments}
          </span>
        </div>
        <Avatar className="h-6 w-6 text-[10px]">
          <AvatarFallback
            className="bg-app-primary text-app-primary-foreground"
            aria-label={`Assigned to ${task.assignee}`}
          >
            {task.assignee}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${DUE_TONE_CLASS[due.tone]}`}
          title={due.full}
        >
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {due.label}
        </span>
        <Badge
          variant="secondary"
          className={`${priority.color} rounded-full border-0 px-2 py-0 text-[10px] font-medium`}
        >
          {priority.name}
        </Badge>
      </div>
    </div>
  );
}
