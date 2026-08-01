import { useMemo } from "react";
import {
  Briefcase,
  Plus,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import type { Task } from "./types";
import { COLUMNS, LABELS } from "./types";
import { getDueMeta } from "./dueDate";

interface ProjectsPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
}

interface ProjectStat {
  labelId: string;
  name: string;
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  assignees: string[];
  progress: number;
}

export function ProjectsPage({ tasks, onAddTask, onOpenTask }: ProjectsPageProps) {
  const { user } = useAuth();

  const stats = useMemo<ProjectStat[]>(() => {
    const map = new Map<string, ProjectStat>();

    for (const task of tasks) {
      const entry = map.get(task.label) ?? {
        labelId: task.label,
        name: LABELS[task.label]?.name ?? task.label,
        total: 0,
        done: 0,
        inProgress: 0,
        todo: 0,
        assignees: [],
        progress: 0,
      };

      entry.total += 1;
      if (task.column === "done") entry.done += 1;
      else if (task.column === "in-progress") entry.inProgress += 1;
      else if (task.column === "todo") entry.todo += 1;

      if (task.assignee && !entry.assignees.includes(task.assignee)) {
        entry.assignees.push(task.assignee);
      }

      map.set(task.label, entry);
    }

    for (const entry of map.values()) {
      entry.progress = entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.column !== "done" && getDueMeta(t).tone === "overdue"
      ).length,
    [tasks]
  );

  const upcomingCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.column !== "done" && getDueMeta(t).tone === "soon"
      ).length,
    [tasks]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-app-card-foreground">Projects</h2>
          <p className="text-xs text-muted-foreground">
            Organized by work stream ({stats.length} active)
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

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 border-b border-border/40 px-6 py-4 sm:grid-cols-4">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-primary/10">
              <Layers className="h-4 w-4 text-app-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">
                {stats.length}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Work streams
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">
                {tasks.filter((t) => t.column === "done").length}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">
                {overdueCount}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
              <ArrowRight className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">
                {upcomingCount}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Due soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          {stats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
              <Briefcase className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">
                No projects yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create tasks to start organizing work streams.
              </p>
              <Button
                onClick={onAddTask}
                size="sm"
                className="mt-4 gap-1.5 rounded-full text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Create first task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.map((project) => {
                const label = LABELS[project.labelId as keyof typeof LABELS];
                return (
                  <Card key={project.labelId} className="border-border/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {label && (
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${label.bg}`}
                          />
                        )}
                        {project.name}
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[10px]"
                        >
                          {project.total} task{project.total !== 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                      <span className="text-xs font-medium text-muted-foreground">
                        {project.progress}%
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={project.progress} className="h-2" />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            {project.todo} to do
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-indigo-400" />
                            {project.inProgress} in progress
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {project.done} done
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {user && (
                            <Avatar className="h-6 w-6 border border-border text-[10px]">
                              <AvatarFallback className="bg-app-muted text-foreground">
                                {user.initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {project.assignees
                            .filter((a) => a !== user?.name)
                            .slice(0, 4)
                            .map((assignee) => (
                              <Avatar
                                key={assignee}
                                className="h-6 w-6 border border-border text-[10px]"
                              >
                                <AvatarFallback className="bg-app-primary text-app-primary-foreground">
                                  {assignee[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                        </div>
                      </div>

                      {/* Recent tasks in this stream */}
                      {tasks
                        .filter((t) => t.label === project.labelId)
                        .slice(0, 3)
                        .map((task) => (
                          <button
                            key={task.id}
                            onClick={() => onOpenTask(task)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/30 bg-app-bg/40 px-3 py-2 text-left transition-colors hover:bg-app-bg/80"
                          >
                            <span
                              className={`truncate text-xs font-medium text-app-card-foreground ${
                                task.column === "done" ? "line-through opacity-60" : ""
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  COLUMNS.find((c) => c.id === task.column)?.color
                                }`}
                              />
                              {getDueMeta(task).label}
                            </span>
                          </button>
                        ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

