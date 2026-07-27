import { useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
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
}

function DroppableColumn({
  column,
  children,
}: {
  column: (typeof COLUMNS)[number];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full min-w-[260px] flex-1 flex-col rounded-2xl p-3 transition-colors ${
        isOver ? "bg-app-muted" : "bg-app-muted/50"
      }`}
    >
      {children}
    </div>
  );
}

export function BoardView({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const newColumn = overColumn?.id ?? overTask?.column;

    if (newColumn && activeTask.column !== newColumn) {
      onUpdateTask({ ...activeTask, column: newColumn });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={tasksByColumn[column.id].map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableColumn column={column}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.color}`} />
                  <h3 className="text-sm font-semibold text-app-card-foreground">
                    {column.title}
                  </h3>
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-app-card px-1.5 text-[10px] font-medium text-muted-foreground">
                    {tasksByColumn[column.id].length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {tasksByColumn[column.id].length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 py-8">
                    <span className="text-xs text-muted-foreground">Drop tasks here</span>
                  </div>
                )}
                {tasksByColumn[column.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onUpdateTask}
                    onDelete={onDeleteTask}
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
