import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Paperclip, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, ColumnId } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export function ListView({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}: ListViewProps) {
  const toggleDone = (task: Task) => {
    onUpdateTask({
      ...task,
      column: task.column === "done" ? "todo" : "done",
    });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-app-card shadow-sm">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-border/50 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto]">
        <span className="sr-only">Done</span>
        <span>Task</span>
        <span className="hidden sm:block">Label</span>
        <span>Priority</span>
        <span className="hidden sm:block">Due</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <ul className="divide-y divide-border/50">
        {tasks.map((task) => {
          const label = LABELS[task.label];
          const priority = PRIORITIES[task.priority];
          return (
            <li
              key={task.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-app-muted/30 sm:grid-cols-[auto_1fr_auto_auto_auto_auto_auto]"
            >
              <Checkbox
                checked={task.column === "done"}
                onCheckedChange={() => toggleDone(task)}
                className="shrink-0"
              />

              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-medium ${
                    task.column === "done"
                      ? "text-muted-foreground line-through"
                      : "text-app-card-foreground"
                  }`}
                >
                  {task.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.description}
                </p>
              </div>

              <Badge
                variant="secondary"
                className={`${label.bg} ${label.text} hidden rounded-full px-2 py-0 text-[10px] font-medium sm:inline-flex hover:${label.bg}`}
              >
                {label.name}
              </Badge>

              <Badge
                variant="secondary"
                className={`${priority.color} rounded-full px-2 py-0 text-[10px] font-medium border-0`}
              >
                {priority.name}
              </Badge>

              <span className="hidden text-xs text-muted-foreground sm:block">
                {task.dueDate}
              </span>

              <Select
                value={task.column}
                onValueChange={(v) =>
                  onUpdateTask({ ...task, column: v as ColumnId })
                }
              >
                <SelectTrigger className="h-8 w-28 rounded-lg border-border/50 bg-transparent text-xs sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onEditTask(task)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {tasks.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No tasks found.</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
