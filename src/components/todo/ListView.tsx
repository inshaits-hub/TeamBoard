import { useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, ColumnId } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";
import { DUE_TONE_CLASS, getDueMeta } from "./dueDate";

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAnnounce: (message: string) => void;
  /** Manual reordering is only offered when the list is in manual sort. */
  reorderable: boolean;
  onReorder: (activeId: string, overId: string) => void;
}

interface RowProps extends Omit<ListViewProps, "tasks" | "onToggleSelectAll" | "onReorder"> {
  task: Task;
}

function TaskRow({
  task,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onOpenTask,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onAnnounce,
  reorderable,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !reorderable });

  const label = LABELS[task.label];
  const priority = PRIORITIES[task.priority];
  const selected = selectedIds.has(task.id);
  const due = getDueMeta(task);

  const toggleDone = () => {
    const nextColumn: ColumnId = task.column === "done" ? "todo" : "done";
    onUpdateTask({ ...task, column: nextColumn });
    onAnnounce(
      `${task.title} marked ${nextColumn === "done" ? "complete" : "not complete"}.`
    );
  };

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-task-row={task.id}
      className={`hover:bg-app-muted/30 ${selected ? "bg-app-muted/40" : ""} ${
        isDragging ? "relative z-10 opacity-70" : ""
      }`}
    >
      {reorderable && (
        <td className="w-8 pl-3 align-middle">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="grid h-8 w-6 cursor-grab place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary active:cursor-grabbing"
            aria-label={`Reorder ${task.title}`}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </td>
      )}

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
            onCheckedChange={toggleDone}
            aria-label={`Mark ${task.title} as ${
              task.column === "done" ? "not complete" : "complete"
            }`}
          />
        )}
      </td>

      <th scope="row" className="min-w-0 px-2 py-3 font-normal">
        <button
          type="button"
          onClick={() => onOpenTask(task)}
          className="block w-full min-w-0 rounded-lg text-left transition-colors hover:text-app-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-2"
          aria-label={`Preview task ${task.title}`}
        >
          <span
            className={`block truncate text-sm font-medium ${
              task.column === "done"
                ? "text-muted-foreground line-through"
                : "text-app-card-foreground"
            }`}
          >
            {task.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {task.description}
          </span>
        </button>
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

      <td className="hidden px-2 py-3 sm:table-cell">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${DUE_TONE_CLASS[due.tone]}`}
          title={due.full}
        >
          {due.label}
        </span>
      </td>

      <td className="px-2 py-3">
        <Select
          value={task.column}
          onValueChange={(v) => onUpdateTask({ ...task, column: v as ColumnId })}
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
}

export function ListView({
  tasks,
  onToggleSelectAll,
  onReorder,
  ...rowProps
}: ListViewProps) {
  const { selectionMode, selectedIds, reorderable, onAnnounce } = rowProps;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
    const moved = tasks.find((t) => t.id === active.id);
    if (moved) onAnnounce(`${moved.title} reordered in the list.`);
  };

  return (
    <DndContext
      id="task-list"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-app-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Task list with label, priority, due date and status
            {reorderable ? ". Drag the handles to reorder tasks." : ""}
          </caption>
          <thead>
            <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              {reorderable && (
                <th scope="col" className="w-8 pl-3">
                  <span className="sr-only">Reorder</span>
                </th>
              )}
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
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} {...rowProps} />
              ))}
            </SortableContext>
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
      <span className="sr-only" aria-live="polite">
        {activeId ? "Reordering task" : ""}
      </span>
    </DndContext>
  );
}
