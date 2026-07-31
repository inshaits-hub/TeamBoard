import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task } from "./types";
import { PRIORITIES } from "./types";
import { parseDue, toISODate } from "./dueDate";

export interface CalendarRange {
  /** ISO `yyyy-mm-dd` of the first day in the selection. */
  start: string;
  /** ISO `yyyy-mm-dd` of the last day in the selection (same as start for a day). */
  end: string;
  mode: "day" | "week";
}

interface CalendarViewProps {
  /** Every task matching the non-calendar filters, used to paint the month. */
  tasks: Task[];
  selection: CalendarRange | null;
  onSelectionChange: (range: CalendarRange | null) => void;
  onOpenTask: (task: Task) => void;
  onAddTask: () => void;
  onRescheduleTask: (task: Task, dueDate: string) => void;
  onAnnounce: (message: string) => void;
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const MAX_CHIPS = 3;

export function CalendarView({
  tasks,
  selection,
  onSelectionChange,
  onOpenTask,
  onAddTask,
  onRescheduleTask,
  onAnnounce,
}: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [focusedDay, setFocusedDay] = useState<Date>(() => new Date());
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [days]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const due = parseDue(task.dueDate);
      if (!due) continue;
      const key = toISODate(due);
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  const unscheduled = useMemo(
    () => tasks.filter((t) => !parseDue(t.dueDate)),
    [tasks]
  );

  const isSelected = (day: Date) => {
    if (!selection) return false;
    const iso = toISODate(day);
    return iso >= selection.start && iso <= selection.end;
  };

  const selectDay = (day: Date) => {
    const iso = toISODate(day);
    if (selection?.mode === "day" && selection.start === iso) {
      onSelectionChange(null);
      onAnnounce("Day filter cleared.");
      return;
    }
    onSelectionChange({ start: iso, end: iso, mode: "day" });
    onAnnounce(`Filtering tasks due ${format(day, "EEEE d MMMM")}.`);
  };

  const selectWeek = (week: Date[]) => {
    const start = toISODate(week[0]);
    const end = toISODate(week[week.length - 1]);
    if (selection?.mode === "week" && selection.start === start) {
      onSelectionChange(null);
      onAnnounce("Week filter cleared.");
      return;
    }
    onSelectionChange({ start, end, mode: "week" });
    onAnnounce(
      `Filtering tasks due between ${format(week[0], "d MMM")} and ${format(
        week[week.length - 1],
        "d MMM"
      )}.`
    );
  };

  // Keep the focused day inside the visible month when navigating months.
  useEffect(() => {
    if (!isSameMonth(focusedDay, month)) setFocusedDay(startOfMonth(month));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const moveFocus = (next: Date) => {
    setFocusedDay(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
    window.requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-day="${toISODate(next)}"]`)
        ?.focus();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, day: Date) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(addDays(day, 1));
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(addDays(day, -1));
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(addDays(day, 7));
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(addDays(day, -7));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectDay(day);
        break;
      case "Escape":
        if (selection) {
          event.preventDefault();
          onSelectionChange(null);
          onAnnounce("Calendar filter cleared.");
        }
        break;
      default:
        break;
    }
  };

  const selectionLabel = selection
    ? selection.mode === "day"
      ? `Due ${format(new Date(`${selection.start}T00:00:00`), "EEE d MMM")}`
      : `Week of ${format(new Date(`${selection.start}T00:00:00`), "d MMM")}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setMonth(subMonths(month, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h2
            className="min-w-[9.5rem] text-center text-base font-semibold text-app-card-foreground"
            aria-live="polite"
          >
            {format(month, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="h-10 rounded-full px-3 text-xs"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              moveFocus(new Date());
            }}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectionLabel && (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full bg-app-primary/10 py-1 pl-3 pr-1 text-xs text-app-primary"
            >
              {selectionLabel}
              <button
                type="button"
                onClick={() => onSelectionChange(null)}
                className="grid h-6 w-6 place-items-center rounded-full hover:bg-app-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary"
                aria-label="Clear calendar filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-full px-3 text-xs"
            onClick={onAddTask}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Schedule task
          </Button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="overflow-hidden rounded-2xl border border-border/50 bg-app-card shadow-sm"
        role="grid"
        aria-label={`Task due dates for ${format(month, "MMMM yyyy")}`}
      >
        <div
          role="row"
          className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] border-b border-border/50 bg-app-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          <span role="columnheader" className="px-2 py-2 text-center">
            Wk
          </span>
          {weeks[0]?.map((day) => (
            <span
              key={day.toISOString()}
              role="columnheader"
              className="px-2 py-2 text-center"
            >
              {format(day, "EEE")}
            </span>
          ))}
        </div>

        {weeks.map((week) => (
          <div
            key={week[0].toISOString()}
            role="row"
            className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] border-b border-border/50 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => selectWeek(week)}
              className={`border-r border-border/50 px-1 text-[10px] font-medium transition-colors hover:bg-app-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-primary ${
                selection?.mode === "week" && selection.start === toISODate(week[0])
                  ? "bg-app-primary/10 text-app-primary"
                  : "text-muted-foreground"
              }`}
              aria-label={`Filter to the week of ${format(week[0], "d MMMM yyyy")}`}
              aria-pressed={
                selection?.mode === "week" && selection.start === toISODate(week[0])
              }
            >
              {format(week[0], "w")}
            </button>

            {week.map((day) => {
              const iso = toISODate(day);
              const dayTasks = byDay.get(iso) ?? [];
              const outside = !isSameMonth(day, month);
              const selected = isSelected(day);

              return (
                <div
                  key={iso}
                  role="gridcell"
                  aria-selected={selected}
                  data-day={iso}
                  tabIndex={isSameDay(day, focusedDay) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, day)}
                  onFocus={() => setFocusedDay(day)}
                  onClick={() => selectDay(day)}
                  onDragOver={(e) => {
                    if (dragTaskId) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || dragTaskId;
                    const task = tasks.find((t) => t.id === id);
                    if (!task) return;
                    onRescheduleTask(task, iso);
                    onAnnounce(`${task.title} rescheduled to ${format(day, "d MMMM")}.`);
                    setDragTaskId(null);
                  }}
                  aria-label={`${format(day, "EEEE d MMMM yyyy")}, ${
                    dayTasks.length
                  } ${dayTasks.length === 1 ? "task" : "tasks"} due`}
                  className={`min-h-[6.5rem] cursor-pointer border-r border-border/50 p-1.5 text-left transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-primary ${
                    outside ? "bg-app-muted/20" : ""
                  } ${selected ? "bg-app-primary/10" : "hover:bg-app-muted/40"}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                        isToday(day)
                          ? "bg-app-primary text-app-primary-foreground"
                          : outside
                            ? "text-muted-foreground/60"
                            : "text-app-card-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-1">
                    {dayTasks.slice(0, MAX_CHIPS).map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", task.id);
                            setDragTaskId(task.id);
                          }}
                          onDragEnd={() => setDragTaskId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTask(task);
                          }}
                          className={`flex w-full items-center gap-1.5 rounded-lg bg-app-muted/70 px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-app-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary ${
                            task.column === "done"
                              ? "text-muted-foreground line-through"
                              : "text-app-card-foreground"
                          }`}
                          title={`${task.title} — ${PRIORITIES[task.priority].name} priority`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{task.title}</span>
                        </button>
                      </li>
                    ))}
                    {dayTasks.length > MAX_CHIPS && (
                      <li className="px-1.5 text-[10px] font-medium text-app-primary">
                        +{dayTasks.length - MAX_CHIPS} more
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <section
        aria-label="Tasks without a due date"
        className="rounded-2xl border border-dashed border-border/60 bg-app-card/60 p-4"
      >
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Unscheduled ({unscheduled.length})
        </h3>
        {unscheduled.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Every task has a due date.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", task.id);
                    setDragTaskId(task.id);
                  }}
                  onDragEnd={() => setDragTaskId(null)}
                  onClick={() => onOpenTask(task)}
                  className="flex items-center gap-1.5 rounded-full bg-app-muted px-3 py-1.5 text-xs text-app-card-foreground transition-colors hover:bg-app-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
                    aria-hidden="true"
                  />
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
