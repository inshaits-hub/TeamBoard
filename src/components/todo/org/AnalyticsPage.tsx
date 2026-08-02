import { useMemo } from "react";
import { BarChart3, Activity, Timer, Target, Users2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip } from "recharts";
import type { Task } from "../types";
import { LABELS } from "../types";
import { getDueMeta } from "../dueDate";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface AnalyticsPageProps {
  tasks: Task[];
}

interface Kpi {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const STATUS_COLORS = ["#94a3b8", "#818cf8", "#f59e0b", "#10b981"];

const chartConfig = {
  todo: { label: "To do", color: "#94a3b8" },
  inProgress: { label: "In progress", color: "#818cf8" },
  review: { label: "Review", color: "#f59e0b" },
  done: { label: "Done", color: "#10b981" },
} satisfies ChartConfig;

export function AnalyticsPage({ tasks }: AnalyticsPageProps) {
  const { isOnline } = useAuth();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.column === "done").length;
    const inProgress = tasks.filter((t) => t.column === "in-progress").length;
    const review = tasks.filter((t) => t.column === "review").length;
    const todo = tasks.filter((t) => t.column === "todo").length;
    const overdue = tasks.filter((t) => t.column !== "done" && getDueMeta(t).tone === "overdue").length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

    // Workload by assignee
    const workloadMap = new Map<string, { open: number; done: number }>();
    for (const task of tasks) {
      const key = task.assignee || "Unassigned";
      const entry = workloadMap.get(key) ?? { open: 0, done: 0 };
      if (task.column === "done") entry.done += 1;
      else entry.open += 1;
      workloadMap.set(key, entry);
    }
    const workload = Array.from(workloadMap.entries())
      .map(([name, value]) => ({ name, ...value, total: value.open + value.done }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 8);

    // Status distribution
    const byStatus = [
      { name: "To do", value: todo, color: STATUS_COLORS[0] },
      { name: "In progress", value: inProgress, color: STATUS_COLORS[1] },
      { name: "Review", value: review, color: STATUS_COLORS[2] },
      { name: "Done", value: done, color: STATUS_COLORS[3] },
    ].filter((s) => s.value > 0);

    // Work stream health
    const health = Object.entries(LABELS).map(([key, label]) => {
      const all = tasks.filter((t) => t.label === key);
      const streamDone = all.filter((t) => t.column === "done").length;
      return {
        name: label.name,
        value: all.length,
        progress: all.length === 0 ? 0 : Math.round((streamDone / all.length) * 100),
      };
    });

    const highPriority = tasks.filter((t) => t.priority === "high" && t.column !== "done").length;

    return { total, done, inProgress, review, todo, overdue, completionRate, workload, byStatus, health, highPriority };
  }, [tasks]);

  const kpis = (s: typeof stats): Kpi[] => [
    { label: "Total tasks", value: s.total, icon: BarChart3, color: "text-app-primary" },
    { label: "Completed", value: s.done, icon: Target, color: "text-emerald-500" },
    { label: "In progress", value: s.inProgress, icon: Activity, color: "text-indigo-500" },
    { label: "Review", value: s.review, icon: Timer, color: "text-amber-500" },
    { label: "Overdue", value: s.overdue, icon: Zap, color: "text-rose-500" },
    { label: "High priority", value: s.highPriority, icon: Target, color: "text-rose-500" },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Organization-wide insights, workload and delivery health"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {!isOnline && <OfflineNotice />}

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(kpis(stats) as Kpi[]).map((kpi) => (
              <Card key={kpi.label} className="border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-app-card-foreground">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Status distribution */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-sm">Task status distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px]">
                  <PieChart>
                    <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {stats.byStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
                  {stats.byStatus.map((s) => (
                    <span key={s.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}: {s.value}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workload */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users2 className="h-4 w-4 text-app-primary" />
                  Workload by assignee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px]">
                  <BarChart data={stats.workload}>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="open" name="Open" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="done" name="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Completion rate */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-sm">Overall completion rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.done} of {stats.total} tasks completed</span>
                <span className="font-semibold text-app-card-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2.5" />
            </CardContent>
          </Card>

          {/* Work stream health */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-sm">Work stream health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.health.map((stream) => (
                <div key={stream.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-app-card-foreground">{stream.name}</span>
                    <span className="text-muted-foreground">{stream.value} tasks · {stream.progress}%</span>
                  </div>
                  <Progress value={stream.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

