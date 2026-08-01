import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  CheckCircle2,
  Pencil,
  Trash2,
  CalendarDays,
  UserCircle2,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, ColumnId, Priority, LabelType } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";
import { getDueMeta } from "./dueDate";

interface TasksPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}

type ColumnFilter = ColumnId | "all";
type PriorityFilter = Priority | "all";

export function TasksPage({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
}: TasksPageProps) {
  const { user, listMembers } = useAuth();
  const [search, setSearch] = useState("");
  const [columnFilter, setColumnFilter] = useState<ColumnFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q && !task.title.toLowerCase().includes(q)) return false;
      if (columnFilter !== "all" && task.column !== columnFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== "all" && task.assignee !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, search, columnFilter, priorityFilter, assigneeFilter]);

  const counts = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.column === "done").length;
    const inProgress = tasks.filter((t) => t.column === "in-progress").length;
    const todo = tasks.filter((t) => t.column === "todo").length;
    const review = tasks.filter((t) => t.column === "review").length;
    return { total, done, inProgress, todo, review };
  }, [tasks]);

  const handleDelete = (task: Task) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDeleteTask(task.id);
      toast.success("Task deleted");
    }
  };

  const handleToggle = (task: Task) => {
    onToggleComplete(task);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-app-card-foreground">Tasks</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {tasks.length} tasks
          </p>
        </div>
        <Button
          onClick={onAddTask}
          className="h-9 gap-1.5 rounded-full text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border/40 px-6 py-4 sm:grid-cols-4">
        {(
          [
            ["Total", counts.total, "text-app-card-foreground"],
            ["To Do", counts.todo, "text-muted-foreground"],
            ["In Progress", counts.inProgress, "text-indigo-500"],
            ["Done", counts.done, "text-emerald-500"],
          ] as const
        ).map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-xl border border-border/40 bg-app-card px-4 py-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-6 py-4">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="rounded-xl pl-9"
          />
        </div>

        <Select
          value={columnFilter}
          onValueChange={(v) => setColumnFilter(v as ColumnFilter)}
        >
          <SelectTrigger className="w-[140px] rounded-xl text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}
        >
          <SelectTrigger className="w-[130px] rounded-xl text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {Object.entries(PRIORITIES).map(([key, p]) => (
              <SelectItem key={key} value={key}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[150px] rounded-xl text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {user && <SelectItem value={user.name}>{user.name}</SelectItem>}
            {tasks
              .map((t) => t.assignee)
              .filter((v, i, a) => a.indexOf(v) === i && v !== user?.name)
              .map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
              <Inbox className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">
                No tasks found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tasks.length === 0
                  ? "Create your first task to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((task) => {
                const label = LABELS[task.label];
                const priority = PRIORITIES[task.priority];
                const column = COLUMNS.find((c) => c.id === task.column);
                const due = getDueMeta(task);
                const assigneeInitial = task.assignee?.[0]?.toUpperCase() || "?";
                return (
                  <div
                    key={task.id}
                    className="group flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-app-card px-4 py-3 transition-colors hover:bg-app-bg/80"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-emerald-500"
                      onClick={() => handleToggle(task)}
                      aria-label={
                        task.column === "done" ? "Reopen task" : "Mark complete"
                      }
                    >
                      <CheckCircle2
                        className={`h-5 w-5 ${
                          task.column === "done"
                            ? "fill-emerald-500 text-emerald-500"
                            : ""
                        }`}
                      />
                    </Button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium text-app-card-foreground ${
                          task.column === "done" ? "line-through opacity-60" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <Badge
                          variant="secondary"
                          className={`${label.bg} ${label.text} rounded-full px-2 py-0 text-[10px] font-medium`}
                        >
                          {label.name}
                        </Badge>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.color}`}>
                          {priority.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {due.label}
                        </span>
                        {column && (
                          <span className="flex items-center gap-1">
                            <span
                              className={`h-2 w-2 rounded-full ${column.color}`}
                            />
                            {column.title}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-app-muted py-1 pl-1 pr-3 text-[11px] text-muted-foreground">
                        <Avatar className="h-6 w-6 text-[10px]">
                          <AvatarFallback className="bg-app-primary text-app-primary-foreground">
                            {assigneeInitial}
                          </AvatarFallback>
                        </Avatar>
                        <UserCircle2 className="h-3 w-3" />
                        {task.assignee}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => onEditTask(task)}
                        aria-label={`Edit ${task.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(task)}
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

