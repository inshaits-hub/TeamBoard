import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Header } from "./Header";
import { SearchFilter } from "./SearchFilter";
import { BoardView } from "./BoardView";
import { ListView } from "./ListView";
import { CalendarView, type CalendarRange } from "./CalendarView";
import { Sidebar } from "./Sidebar";
import { AppSidebar } from "./AppSidebar";
import type { PageId } from "./AppSidebar";
import { MembersPage } from "./MembersPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";
import { ProfilePage } from "./ProfilePage";
import { TaskForm } from "./TaskForm";
import { TaskPreviewSheet } from "./TaskPreviewSheet";
import { BulkActionBar } from "./BulkActionBar";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { LiveRegion } from "./LiveRegion";
import { SignOutDialog } from "./SignOutDialog";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  applyOrder,
  useTaskStore,
  type RemovedTask,
} from "./useTaskStore";
import { downloadTasks, mergeTasks, parseTasksFile } from "./taskIO";
import { matchesDueFilter, sortTasks, type DueFilter, type SortMode } from "./dueDate";
import { useAuth } from "@/contexts/AuthContext";
import {
  notifyTaskCreated,
  notifyTaskUpdated,
  notifyTaskDeleted,
  useDeadlineChecker,
} from "./NotificationProvider";
import type { ColumnId, LabelType, Priority, Task } from "./types";

/** How long an undo toast stays actionable, in milliseconds. */
const UNDO_TIMEOUT = 6000;

export function TodoApp() {
  const { user, logout, token } = useAuth();

  const {
    tasks,
    order,
    online,
    view,
    setView,
    saveTask,
    deleteTask,
    deleteTasks,
    restoreTasks,
    setColumnForTasks,
    setPriorityForTasks,
    reorderTasks,
    replaceAll,
  } = useTaskStore(token);

  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<LabelType | "all">("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<ColumnId | undefined>();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [calendarRange, setCalendarRange] = useState<CalendarRange | null>(null);
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

  const previewTask = useMemo(
    () => tasks.find((t) => t.id === previewId) ?? null,
    [tasks, previewId]
  );


  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    const matched = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q);
      const matchesLabel = labelFilter === "all" || task.label === labelFilter;
      return matchesSearch && matchesLabel && matchesDueFilter(task, dueFilter);
    });
    return matched;
  }, [tasks, search, labelFilter, dueFilter]);

  /** Board and list each honour their own saved manual ordering. */
  const boardTasks = useMemo(
    () =>
      sortMode === "manual"
        ? applyOrder(filteredTasks, order.board)
        : sortTasks(filteredTasks, sortMode),
    [filteredTasks, order.board, sortMode]
  );

  const listTasks = useMemo(
    () =>
      sortMode === "manual"
        ? applyOrder(filteredTasks, order.list)
        : sortTasks(filteredTasks, sortMode),
    [filteredTasks, order.list, sortMode]
  );

  /** Calendar day/week selection narrows the visible tasks further. */
  const calendarTasks = useMemo(() => {
    if (!calendarRange) return filteredTasks;
    return filteredTasks.filter((task) => {
      const iso = task.dueDate?.slice(0, 10);
      return Boolean(iso) && iso >= calendarRange.start && iso <= calendarRange.end;
    });
  }, [filteredTasks, calendarRange]);

  const visibleTasks =
    view === "calendar" ? calendarTasks : view === "list" ? listTasks : boardTasks;

  const handleAddTask = useCallback((column?: ColumnId) => {
    setEditingTask(null);
    setDefaultColumn(column);
    setFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setPreviewId(null);
    setEditingTask(task);
    setDefaultColumn(undefined);
    setFormOpen(true);
  }, []);

  const handleOpenTask = useCallback((task: Task) => {
    setPreviewId(task.id);
  }, []);

  /** Shows an undo toast that restores the removed tasks in place. */
  const offerUndo = useCallback(
    (removed: RemovedTask[], message: string) => {
      if (removed.length === 0) return;
      toast.success(message, {
        duration: UNDO_TIMEOUT,
        action: {
          label: "Undo",
          onClick: () => {
            restoreTasks(removed);
            toast.success(
              removed.length === 1
                ? "Task restored"
                : `${removed.length} tasks restored`
            );
            announce(
              removed.length === 1
                ? "Task restored."
                : `${removed.length} tasks restored.`
            );
          },
        },
      });
    },
    [restoreTasks, announce]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      const deleted = tasks.find((t) => t.id === id);
      const removed = deleteTask(id);
      if (deleted) notifyTaskDeleted(deleted.title);
      setPreviewId((prev) => (prev === id ? null : prev));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      offerUndo(removed, `"${deleted?.title ?? "Task"}" deleted`);
      announce(`${deleted?.title ?? "Task"} deleted. Undo available.`);
    },
    [deleteTask, tasks, offerUndo, announce]
  );

  const handleToggleComplete = useCallback(
    (task: Task) => {
      const nextColumn: ColumnId = task.column === "done" ? "todo" : "done";
      saveTask({ ...task, column: nextColumn });
      toast.success(
        nextColumn === "done" ? "Task completed" : "Task reopened"
      );
      announce(
        `${task.title} marked ${nextColumn === "done" ? "complete" : "not complete"}.`
      );
      setPreviewId(null);
    },
    [saveTask, announce]
  );


  const handleSignOut = useCallback(() => {
    setSignOutOpen(false);
    toast.success("Signed out successfully");
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
      prev.size === visibleTasks.length
        ? new Set()
        : new Set(visibleTasks.map((t) => t.id))
    );
  }, [visibleTasks]);

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
    const count = selectedList.length;
    const removed = deleteTasks(selectedList);
    offerUndo(removed, `${count} tasks deleted`);
    announce(`${count} tasks deleted. Undo available.`);
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
    replaceAll(mergeTasks(tasks, result.tasks), {
      board: order.board,
      list: order.list,
    });
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

  // Determine if the current page is task-related (shows the right sidebar)
  const isTaskPage = currentPage === "dashboard" || currentPage === "tasks";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-dvh w-full bg-app-bg text-foreground">
        <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <SidebarInset className="flex flex-col">
          {/* Skip link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-app-primary focus:px-4 focus:py-2 focus:text-sm focus:text-app-primary-foreground"
          >
            Skip to content
          </a>

          {currentPage === "dashboard" && (
            <>
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
                onTeamDashboardClick={() => setCurrentPage("members")}
                online={online}
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
                        dueFilter={dueFilter}
                        onDueFilterChange={setDueFilter}
                        sortMode={sortMode}
                        onSortModeChange={setSortMode}
                        resultCount={visibleTasks.length}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-[1600px]">
                      {view === "board" ? (
                        <BoardView
                          tasks={boardTasks}
                          onUpdateTask={saveTask}
                          onDeleteTask={handleDeleteTask}
                          onAddTask={handleAddTask}
                          onEditTask={handleEditTask}
                          onOpenTask={handleOpenTask}
                          selectionMode={selectionMode}
                          selectedIds={selectedIds}
                          onToggleSelect={toggleSelect}
                          onAnnounce={announce}
                          reorderable={sortMode === "manual" && !selectionMode}
                          onReorder={(a, b) => reorderTasks("board", a, b)}
                        />
                      ) : view === "list" ? (
                        <ListView
                          tasks={listTasks}
                          onUpdateTask={saveTask}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={handleEditTask}
                          onOpenTask={handleOpenTask}
                          selectionMode={selectionMode}
                          selectedIds={selectedIds}
                          onToggleSelect={toggleSelect}
                          onToggleSelectAll={toggleSelectAll}
                          onAnnounce={announce}
                          reorderable={sortMode === "manual" && !selectionMode}
                          onReorder={(a, b) => reorderTasks("list", a, b)}
                        />
                      ) : (
                        <CalendarView
                          tasks={filteredTasks}
                          selection={calendarRange}
                          onSelectionChange={setCalendarRange}
                          onOpenTask={handleOpenTask}
                          onAddTask={() => handleAddTask()}
                          onRescheduleTask={(task, dueDate) =>
                            saveTask({ ...task, dueDate })
                          }
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
            </>
          )}

          {currentPage === "members" && (
            <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
              <MembersPage />
            </main>
          )}

          {currentPage === "projects" && (
            <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
              <ProjectsPage
                tasks={tasks}
                onAddTask={() => handleAddTask()}
                onOpenTask={handleOpenTask}
              />
            </main>
          )}

          {currentPage === "tasks" && (
            <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
              <TasksPage
                tasks={tasks}
                onAddTask={() => handleAddTask()}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
              />
            </main>
          )}

          {currentPage === "profile" && (
            <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
              <ProfilePage />
            </main>
          )}
        </SidebarInset>

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

        <TaskPreviewSheet
          task={previewTask}
          open={previewTask !== null}
          onOpenChange={(open) => {
            if (!open) setPreviewId(null);
          }}
          onEdit={handleEditTask}
          onToggleComplete={handleToggleComplete}
          onDelete={(task) => handleDeleteTask(task.id)}
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
    </SidebarProvider>
  );
}
