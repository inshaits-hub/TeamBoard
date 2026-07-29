import { useMemo, useState, useCallback } from "react";
import { Header } from "./Header";
import { SearchFilter } from "./SearchFilter";
import { BoardView } from "./BoardView";
import { ListView } from "./ListView";
import { Sidebar } from "./Sidebar";
import { TaskForm } from "./TaskForm";
import { SignOutDialog } from "./SignOutDialog";
import { INITIAL_TASKS } from "./data";
import type { Task, ColumnId, LabelType } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskDeleted,
  useDeadlineChecker,
} from "./NotificationProvider";

export function TodoApp() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<ColumnId | undefined>();
  const [signOutOpen, setSignOutOpen] = useState(false);

  // Check for upcoming deadlines
  useDeadlineChecker(tasks);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());
      const matchesLabel = labelFilter === "all" || task.label === labelFilter;
      return matchesSearch && matchesLabel;
    });
  }, [tasks, search, labelFilter]);

  const handleAddTask = useCallback((column?: ColumnId) => {
    setEditingTask(null);
    setDefaultColumn(column);
    setFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultColumn(undefined);
    setFormOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === task.id);
        if (exists) {
          notifyTaskUpdated(task.title);
          return prev.map((t) => (t.id === task.id ? task : t));
        }
        notifyTaskCreated(task.title);
        return [task, ...prev];
      });
    },
    []
  );

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const deleted = prev.find((t) => t.id === id);
      if (deleted) notifyTaskDeleted(deleted.title);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const handleSignOut = useCallback(() => {
    setSignOutOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-foreground transition-colors duration-300">
      <Header
        view={view}
        onViewChange={setView}
        onAddTask={() => handleAddTask()}
        user={user}
        onSignOutClick={() => setSignOutOpen(true)}
        theme={theme}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/40 bg-app-bg/60 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
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

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
        userName={user?.name}
      />
    </div>
  );
}
