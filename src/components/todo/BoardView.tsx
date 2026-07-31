import { useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import type { Task, ColumnId } from "./types";
import { COLUMNS } from "./types";

interface BoardViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (column?: ColumnId) => void;
  onEditTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onAnnounce: (message: string) => void;
  /** Manual reordering only applies while the board is in manual sort. */
  reorderable: boolean;
  onReorder: (activeId: string, overId: string) => void;
}

function DroppableColumn({
  column,
  count,
  children,
}: {
  column: (typeof COLUMNS)[number];
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <section
      ref={setNodeRef}
      data-lovable-todo-column={column.id}
      aria-label={`${column.title}, ${count} ${count === 1 ? "task" : "tasks"}`}
      className={`flex h-full min-w-[260px] flex-1 flex-col rounded-2xl p-3 transition-colors ${
        isOver ? "bg-app-muted" : "bg-app-muted/50"
      }`}
    >
      {children}
    </section>
  );
}

function focusCard(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-task-card="${id}"]`);
  el?.focus();
}

export function BoardView({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onEditTask,
  onOpenTask,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onAnnounce,
  reorderable,
  onReorder,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByColumn = useMemo(() => {
    return COLUMNS.reduce(
      (acc, col) => {
        acc[col.id] = tasks.filter((t) => t.column === col.id);
        return acc;
      },
      {} as Record<ColumnId, Task[]>
    );
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === draggedId);
    if (!draggedTask) return;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const newColumn = overColumn?.id ?? overTask?.column;

    if (newColumn && draggedTask.column !== newColumn) {
      onUpdateTask({ ...draggedTask, column: newColumn });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const overId = over ? String(over.id) : null;
    const activeTaskId = String(active.id);

    // Dropping onto another card persists the manual ordering for the board.
    if (
      reorderable &&
      overId &&
      overId !== activeTaskId &&
      tasks.some((t) => t.id === overId)
    ) {
      onReorder(activeTaskId, overId);
    }

    const moved = activeId ? tasks.find((t) => t.id === activeId) : null;
    if (moved) {
      const columnTitle = COLUMNS.find((c) => c.id === moved.column)?.title;
      onAnnounce(`${moved.title} moved to ${columnTitle}.`);
    }
    setActiveId(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const cardId = target.getAttribute?.("data-task-card");
    if (!cardId) return;

    const task = tasks.find((t) => t.id === cardId);
    if (!task) return;

    const columnIndex = COLUMNS.findIndex((c) => c.id === task.column);
    const inColumn = tasksByColumn[task.column];
    const index = inColumn.findIndex((t) => t.id === cardId);

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = inColumn[Math.min(index + 1, inColumn.length - 1)];
        if (next) focusCard(next.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prev = inColumn[Math.max(index - 1, 0)];
        if (prev) focusCard(prev.id);
        break;
      }
      case "ArrowRight":
      case "ArrowLeft": {
        event.preventDefault();
        const dir = event.key === "ArrowRight" ? 1 : -1;
        for (let i = 1; i <= COLUMNS.length; i++) {
          const target = COLUMNS[(columnIndex + dir * i + COLUMNS.length * i) % COLUMNS.length];
          const list = tasksByColumn[target.id];
          if (list.length > 0) {
            focusCard(list[Math.min(index, list.length - 1)].id);
            break;
          }
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        onOpenTask(task);
        break;
      }
      case " ": {
        if (!selectionMode) return;
        event.preventDefault();
        onToggleSelect(task.id);
        break;
      }
      case "Delete":
      case "Backspace": {
        event.preventDefault();
        onDeleteTask(task.id);
        onAnnounce(`${task.title} deleted.`);
        break;
      }
      default:
        break;
    }
  };

  return (
    <DndContext
      id="task-board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up task ${active.id}.`,
          onDragOver: ({ over }) =>
            over ? `Task moved over ${over.id}.` : "Task is no longer over a column.",
          onDragEnd: ({ over }) =>
            over ? `Task dropped on ${over.id}.` : "Task drop cancelled.",
          onDragCancel: () => "Dragging cancelled.",
        },
      }}
    >
      <div
        className="flex h-full gap-4 overflow-x-auto pb-4"
        onKeyDown={handleKeyDown}
      >
        {COLUMNS.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={tasksByColumn[column.id].map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableColumn column={column} count={tasksByColumn[column.id].length}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${column.color}`}
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold text-app-card-foreground">
                    {column.title}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="grid h-5 min-w-5 place-items-center rounded-full bg-app-card px-1.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tasksByColumn[column.id].length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTask(column.id)}
                  aria-label={`Add task to ${column.title}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {tasksByColumn[column.id].length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 py-8">
                    <span className="text-xs text-muted-foreground">
                      Drop tasks here
                    </span>
                  </div>
                )}
                {tasksByColumn[column.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onOpen={onOpenTask}
                    onDelete={onDeleteTask}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </div>
            </DroppableColumn>
          </SortableContext>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
