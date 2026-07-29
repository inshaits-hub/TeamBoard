import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, ColumnId } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAnnounce: (message: string) => void;
}

export function ListView({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onAnnounce,
}: ListViewProps) {
  const toggleDone = (task: Task) => {
    const nextColumn: ColumnId = task.column === "done" ? "todo" : "done";
    onUpdateTask({ ...task, column: nextColumn });
    onAnnounce(
      `${task.title} marked ${nextColumn === "done" ? "complete" : "not complete"}.`
    );
  };

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-app-card shadow-sm">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Task list with label, priority, due date and status
        </caption>
        <thead>
          <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="w-10 px-4 py-3">
              {selectionMode ? (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all visible tasks"
                />
              ) : (
                <span className="sr-only">Done</span>
              )}
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Task
            </th>
            <th scope="col" className="hidden px-2 py-3 font-medium sm:table-cell">
              Label
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Priority
            </th>
            <th scope="col" className="hidden px-2 py-3 font-medium sm:table-cell">
              Due
            </th>
            <th scope="col" className="px-2 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/50">
          {tasks.map((task) => {
            const label = LABELS[task.label];
            const priority = PRIORITIES[task.priority];
            const selected = selectedIds.has(task.id);
            return (
              <tr
                key={task.id}
                data-task-row={task.id}
                className={`hover:bg-app-muted/30 ${selected ? "bg-app-muted/40" : ""}`}
              >
                <td className="px-4 py-3 align-middle">
                  {selectionMode ? (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect(task.id)}
                      aria-label={`Select task ${task.title}`}
                    />
                  ) : (
                    <Checkbox
                      checked={task.column === "done"}
                      onCheckedChange={() => toggleDone(task)}
                      aria-label={`Mark ${task.title} as ${
                        task.column === "done" ? "not complete" : "complete"
                      }`}
                    />
                  )}
                </td>

                <th scope="row" className="min-w-0 px-2 py-3 font-normal">
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
                </th>

                <td className="hidden px-2 py-3 sm:table-cell">
                  <Badge
                    variant="secondary"
                    className={`${label.bg} ${label.text} rounded-full px-2 py-0 text-[10px] font-medium hover:${label.bg}`}
                  >
                    {label.name}
                  </Badge>
                </td>

                <td className="px-2 py-3">
                  <Badge
                    variant="secondary"
                    className={`${priority.color} rounded-full border-0 px-2 py-0 text-[10px] font-medium`}
                  >
                    {priority.name}
                  </Badge>
                </td>

                <td className="hidden px-2 py-3 text-xs text-muted-foreground sm:table-cell">
                  {task.dueDate}
                </td>

                <td className="px-2 py-3">
                  <Select
                    value={task.column}
                    onValueChange={(v) =>
                      onUpdateTask({ ...task, column: v as ColumnId })
                    }
                  >
                    <SelectTrigger
                      aria-label={`Status for ${task.title}`}
                      className="h-9 w-28 rounded-lg border-border/50 bg-transparent text-xs sm:w-32"
                    >
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
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => onEditTask(task)}
                      aria-label={`Edit task ${task.title}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        onDeleteTask(task.id);
                        onAnnounce(`${task.title} deleted.`);
                      }}
                      aria-label={`Delete task ${task.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
