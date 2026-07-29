import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task } from "./types";
import { LABELS, PRIORITIES } from "./types";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, isOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  const label = LABELS[task.label];
  const priority = PRIORITIES[task.priority];
  const isPaused = task.column === "paused";
  const isDone = task.column === "done";

  const startEditing = () => {
    setDraft(task);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(task);
    setIsEditing(false);
  };

  const saveEditing = () => {
    onEdit(draft);
    setIsEditing(false);
  };

  // While editing, don't wire up drag listeners — otherwise clicking into
  // an input or select on the card starts a drag instead of focusing it.
  const dragProps = isEditing ? {} : { ...attributes, ...listeners };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        data-lovable-todo-card={task.id}
        style={style}
        className="
          relative rounded-2xl border p-4 shadow-md
          border-app-primary/40 bg-app-card
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Editing task
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={cancelEditing}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-app-primary hover:text-app-primary"
              onClick={saveEditing}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Task title"
          className="
            mt-3 w-full rounded-lg border border-app-primary/30 bg-app-bg
            px-2.5 py-1.5 text-sm font-semibold text-app-card-foreground
            outline-none focus:border-app-primary
          "
        />

        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="
            mt-2 w-full resize-none rounded-lg border border-app-primary/30
            bg-app-bg px-2.5 py-1.5 text-xs text-app-card-foreground
            outline-none focus:border-app-primary
          "
        />

        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            value={draft.label}
            onChange={(e) =>
              setDraft({ ...draft, label: e.target.value as Task["label"] })
            }
            className="
              rounded-lg border border-app-primary/30 bg-app-bg px-2 py-1.5
              text-xs text-app-card-foreground outline-none focus:border-app-primary
            "
          >
            {Object.entries(LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>

          <select
            value={draft.priority}
            onChange={(e) =>
              setDraft({ ...draft, priority: e.target.value as Task["priority"] })
            }
            className="
              rounded-lg border border-app-primary/30 bg-app-bg px-2 py-1.5
              text-xs text-app-card-foreground outline-none focus:border-app-primary
            "
          >
            {Object.entries(PRIORITIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={draft.dueDate}
            onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            placeholder="Due date"
            className="
              rounded-lg border border-app-primary/30 bg-app-bg px-2 py-1.5
              text-xs text-app-card-foreground outline-none focus:border-app-primary
            "
          />
          <input
            value={draft.assignee}
            onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
            placeholder="Assignee"
            className="
              rounded-lg border border-app-primary/30 bg-app-bg px-2 py-1.5
              text-xs text-app-card-foreground outline-none focus:border-app-primary
            "
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            onClick={cancelEditing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 rounded-lg bg-app-primary text-xs font-semibold text-app-primary-foreground hover:opacity-90"
            onClick={saveEditing}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-lovable-todo-card={task.id}
      style={style}
      className={`
        group relative cursor-grab rounded-2xl border p-4 shadow-sm transition-all
        hover:shadow-md active:cursor-grabbing
        ${isDragging ? "opacity-30" : "opacity-100"}
        ${isOverlay ? "rotate-2 shadow-lg" : ""}
        ${
          isPaused
            ? "border-dashed border-[#8C9B5C]/40 bg-[#B7C9AA]/25 opacity-70 dark:bg-[#3D5A33]/15 dark:border-[#8C9B5C]/20"
            : "border-[#8C9B5C]/30 bg-[#B7C9AA]/25 dark:bg-[#3D5A33]/15 dark:border-[#8C9B5C]/20"
        }
      `}
      {...dragProps}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="secondary"
          className={`${label.bg} ${label.text} rounded-full px-2.5 py-0.5 text-[10px] font-medium hover:${label.bg}`}
        >
          {label.name}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="drag-handle h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <h3
        className={`mt-3 text-sm font-semibold leading-snug line-clamp-2 cursor-pointer ${
          isDone
            ? "text-muted-foreground line-through"
            : isPaused
              ? "text-[#8B5A2B] dark:text-[#C9A227]"
              : "text-app-card-foreground"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
      >
        {task.title}
        {isPaused && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#C9A227]/25 px-2 py-0.5 text-[9px] font-medium text-[#8B5A2B] dark:bg-[#8B5A2B]/30 dark:text-[#C9A227]">
            Paused
          </span>
        )}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {task.comments}
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachments}
          </span>
        </div>
        <Avatar className="h-6 w-6 text-[10px]">
          <AvatarFallback className="bg-[#3D5A33] text-white">
            {task.assignee}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-[10px] text-muted-foreground">{task.dueDate}</span>
        <Badge
          variant="secondary"
          className={`${priority.color} rounded-full px-2 py-0 text-[10px] font-medium border-0`}
        >
          {priority.name}
        </Badge>
      </div>
    </div>
  );
}