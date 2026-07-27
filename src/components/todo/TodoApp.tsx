import { useMemo, useState } from "react";
import { Header } from "./Header";
import { SearchFilter } from "./SearchFilter";
import { BoardView } from "./BoardView";
import { ListView } from "./ListView";
import { Sidebar } from "./Sidebar";
import { TaskForm } from "./TaskForm";
import { INITIAL_TASKS } from "./data";
import type { Task, ColumnId, LabelType } from "./types";

export function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<ColumnId | undefined>();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());
      const matchesLabel = labelFilter === "all" || task.label === labelFilter;
      return matchesSearch && matchesLabel;
    });
  }, [tasks, search, labelFilter]);

  const handleAddTask = (column?: ColumnId) => {
    setEditingTask(null);
    setDefaultColumn(column);
    setFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultColumn(undefined);
    setFormOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [task, ...prev];
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-foreground">
      <Header view={view} onViewChange={setView} onAddTask={() => handleAddTask()} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/40 bg-app-bg px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">
              <SearchFilter
                search={search}
                onSearchChange={setSearch}
                labelFilter={labelFilter}
                onLabelFilterChange={setLabelFilter}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">
              {view === "board" ? (
                <BoardView
                  tasks={filteredTasks}
                  onUpdateTask={handleSaveTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                />
              ) : (
                <ListView
                  tasks={filteredTasks}
                  onUpdateTask={handleSaveTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                />
              )}
            </div>
          </div>
        </main>

        <Sidebar tasks={tasks} />
      </div>

      <TaskForm
        task={editingTask}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(task) =>
          handleSaveTask({
            ...task,
            column: editingTask ? task.column : defaultColumn ?? "todo",
          })
        }
      />
    </div>
  );
}
