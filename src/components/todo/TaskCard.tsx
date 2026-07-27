import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Paperclip, MoreHorizontal, GripVertical } from "lucide-react";
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
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = LABELS[task.label];
  const priority = PRIORITIES[task.priority];

  return (
    <div
      ref={setNodeRef}
      data-lovable-todo-card={task.id}
      style={style}
      className={`
        group relative cursor-grab rounded-2xl border border-border/50 bg-app-card p-4 shadow-sm transition-all
        hover:shadow-md active:cursor-grabbing
        ${isDragging ? "opacity-30" : "opacity-100"}
        ${isOverlay ? "rotate-2 shadow-lg" : ""}
      `}
      {...attributes}
      {...listeners}
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
              onEdit(task);
            }}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <h3
        className="mt-3 text-sm font-semibold leading-snug text-app-card-foreground line-clamp-2 cursor-pointer"
        onClick={() => onEdit(task)}
      >
        {task.title}
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
          <AvatarFallback className="bg-app-primary text-app-primary-foreground">
            {task.assignee}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
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
