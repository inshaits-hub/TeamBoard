import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Header } from "./Header";
import { SearchFilter } from "./SearchFilter";
import { BoardView } from "./BoardView";
import { ListView } from "./ListView";
import { Sidebar } from "./Sidebar";
import { TaskForm } from "./TaskForm";
import { BulkActionBar } from "./BulkActionBar";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { LiveRegion } from "./LiveRegion";
import { SignOutDialog } from "./SignOutDialog";
import { useTaskStore } from "./useTaskStore";
import { downloadTasks, mergeTasks, parseTasksFile } from "./taskIO";
import { useAuth } from "@/contexts/AuthContext";
import {
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskDeleted,
  useDeadlineChecker,
} from "./NotificationProvider";
import type { ColumnId, LabelType, Priority, Task } from "./types";

export function TodoApp() {
  const {
    tasks,
    setTasks,
    view,
    setView,
    saveTask,
    deleteTask,
    deleteTasks,
    setColumnForTasks,
    setPriorityForTasks,
  } = useTaskStore();

  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<ColumnId | undefined>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useDeadlineChecker(tasks);

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 50);
  }, []);

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q);
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

  const handleDeleteTask = useCallback(
    (id: string) => {
      const deleted = tasks.find((t) => t.id === id);
      deleteTask(id);
      if (deleted) notifyTaskDeleted(deleted.title);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteTask, tasks]
  );

  const handleSignOut = useCallback(() => {
    setSignOutOpen(false);
    logout();
  }, [logout]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === filteredTasks.length
        ? new Set()
        : new Set(filteredTasks.map((t) => t.id))
    );
  }, [filteredTasks]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      announce(prev ? "Selection mode off." : "Selection mode on.");
      return !prev;
    });
  }, [announce]);

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const bulkComplete = () => {
    setColumnForTasks(selectedList, "done");
    toast.success(`${selectedList.length} tasks marked complete`);
    announce(`${selectedList.length} tasks marked complete.`);
    clearSelection();
  };

  const bulkMove = (column: ColumnId) => {
    setColumnForTasks(selectedList, column);
    toast.success(`${selectedList.length} tasks moved`);
    announce(`${selectedList.length} tasks moved.`);
    clearSelection();
  };

  const bulkPriority = (priority: Priority) => {
    setPriorityForTasks(selectedList, priority);
    toast.success(`Priority updated for ${selectedList.length} tasks`);
    announce(`Priority updated for ${selectedList.length} tasks.`);
    clearSelection();
  };

  const bulkDelete = () => {
    deleteTasks(selectedList);
    toast.success(`${selectedList.length} tasks deleted`);
    announce(`${selectedList.length} tasks deleted.`);
    clearSelection();
  };

  const handleExport = () => {
    downloadTasks(tasks);
    toast.success("Tasks exported");
    announce("Tasks exported as JSON.");
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = parseTasksFile(text);
    if (!result.ok) {
      toast.error(result.error);
      announce(`Import failed. ${result.error}`);
      return;
    }
    setTasks((prev) => mergeTasks(prev, result.tasks));
    const skipped = result.skipped
      ? ` ${result.skipped} entries were skipped.`
      : "";
    toast.success(`Imported ${result.tasks.length} tasks.${skipped}`);
    announce(`Imported ${result.tasks.length} tasks.${skipped}`);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "Escape" && selectedIds.size > 0) {
        clearSelection();
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "n") {
        event.preventDefault();
        handleAddTask();
      } else if (event.key === "s") {
        event.preventDefault();
        toggleSelectionMode();
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAddTask, toggleSelectionMode, clearSelection, selectedIds.size]);

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-app-primary focus:px-4 focus:py-2 focus:text-sm focus:text-app-primary-foreground"
      >
        Skip to tasks
      </a>

      <Header
        view={view}
        onViewChange={setView}
        onAddTask={() => handleAddTask()}
        selectionMode={selectionMode}
        onToggleSelectionMode={toggleSelectionMode}
        onExport={handleExport}
        onImport={() => fileRef.current?.click()}
        onShowShortcuts={() => setShortcutsOpen(true)}
        user={user}
        onSignOutClick={() => setSignOutOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/40 bg-app-bg px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">
              <SearchFilter
                ref={searchRef}
                search={search}
                onSearchChange={setSearch}
                labelFilter={labelFilter}
                onLabelFilterChange={setLabelFilter}
                resultCount={filteredTasks.length}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px]">
              {view === "board" ? (
                <BoardView
                  tasks={filteredTasks}
                  onUpdateTask={saveTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onAnnounce={announce}
                />
              ) : (
                <ListView
                  tasks={filteredTasks}
                  onUpdateTask={saveTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  onAnnounce={announce}
                />
              )}

              {selectedIds.size > 0 && (
                <BulkActionBar
                  count={selectedIds.size}
                  onComplete={bulkComplete}
                  onMove={bulkMove}
                  onPriority={bulkPriority}
                  onDelete={bulkDelete}
                  onClear={clearSelection}
                />
              )}
            </div>
          </div>
        </main>

        <Sidebar tasks={tasks} />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = "";
        }}
      />

      <TaskForm
        task={editingTask}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(task) => {
          const isNew = !editingTask;
          saveTask({
            ...task,
            column: editingTask ? task.column : defaultColumn ?? "todo",
          });
          if (isNew) {
            notifyTaskCreated(task.title);
          } else {
            notifyTaskUpdated(task.title);
          }
          announce(`${task.title} saved.`);
        }}
      />

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <LiveRegion message={announcement} />

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
        userName={user?.name}
      />
    </div>
  );
}
