import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ACTIVITIES } from "./data";
import { COLUMNS } from "./types";
import type { Task } from "./types";

interface SidebarProps {
  tasks: Task[];
}

export function Sidebar({ tasks }: SidebarProps) {
  const total = tasks.length || 1;
  const progressData = [
    { label: "Copywriting", done: tasks.filter((t) => t.label === "copywriting" && t.column === "done").length, total: tasks.filter((t) => t.label === "copywriting").length },
    { label: "Illustrations", done: tasks.filter((t) => t.label === "illustration" && t.column === "done").length, total: tasks.filter((t) => t.label === "illustration").length },
    { label: "UI Design", done: tasks.filter((t) => t.label === "design" && t.column === "done").length, total: tasks.filter((t) => t.label === "design").length },
  ];

  const columnCounts = COLUMNS.map((col) => ({
    ...col,
    count: tasks.filter((t) => t.column === col.id).length,
  }));

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 border-l border-border/40 bg-app-bg/50 p-6 lg:flex">
      <div>
        <h2 className="text-sm font-semibold text-app-card-foreground">Task Progress</h2>
        <div className="mt-4 space-y-4">
          {progressData.map((item) => {
            const pct = item.total ? Math.round((item.done / item.total) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-app-card-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.done}/{item.total}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-app-card-foreground">Columns</h2>
        <div className="mt-3 space-y-2">
          {columnCounts.map((col) => (
            <div
              key={col.id}
              className="flex items-center justify-between rounded-xl bg-app-card px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.color}`} />
                <span className="text-app-card-foreground">{col.title}</span>
              </div>
              <span className="font-medium text-muted-foreground">{col.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-app-card-foreground">Recent Activity</h2>
        <div className="mt-4 space-y-4">
          {ACTIVITIES.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 text-[10px]">
                <AvatarFallback className={activity.color}>
                  {activity.user[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-app-card-foreground">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}