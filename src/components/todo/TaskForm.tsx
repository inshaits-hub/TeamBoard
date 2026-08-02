import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseDue, toISODate } from "./dueDate";
import { useAuth } from "@/contexts/AuthContext";
import type { Task, ColumnId, Priority, LabelType } from "./types";
import { COLUMNS, LABELS, PRIORITIES } from "./types";

interface TaskFormProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
}

const DEFAULT_TASK: Omit<Task, "id" | "createdAt"> = {
  title: "",
  description: "",
  column: "todo",
  priority: "medium",
  label: "design",
  severity: "minor",
  reviewer: "",
  storyPoints: 0,
  estimatedEffort: 0,
  dependencies: [],
  subtasks: [],
  checklist: [],
  recurrence: { frequency: "none", interval: 1, endsOn: "" },
  createdBy: "",
  dueDate: toISODate(new Date()),
  assignee: "Me",
  comments: 0,
  attachments: 0,
};

export function TaskForm({ task, open, onOpenChange, onSave }: TaskFormProps) {
  const { user, listMembers } = useAuth();
  const [members, setMembers] = useState<Array<{ name: string; email: string }>>([]);
  const [form, setForm] = useState<Omit<Task, "id" | "createdAt">>(DEFAULT_TASK);

  useEffect(() => {
    if (task) {
      const { id, createdAt, ...rest } = task;
      setForm(rest);
    } else {
      setForm(DEFAULT_TASK);
    }
  }, [task, open]);

  useEffect(() => {
    listMembers().then((data) => {
      setMembers(data.map((m) => ({ name: m.name, email: m.email })));
    }).catch(() => {});
  }, [listMembers, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onSave({
      ...form,
      id: task?.id ?? crypto.randomUUID(),
      createdAt: task?.createdAt ?? new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedDue = parseDue(form.dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="What needs to be done?"
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Add details..."
                className="rounded-xl min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="column">Status</Label>
                <Select
                  value={form.column}
                  onValueChange={(v) => update("column", v as ColumnId)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => update("priority", v as Priority)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITIES).map(([key, p]) => (
                      <SelectItem key={key} value={key}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Select
                  value={form.label}
                  onValueChange={(v) => update("label", v as LabelType)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LABELS).map(([key, l]) => (
                      <SelectItem key={key} value={key}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      type="button"
                      variant="outline"
                      className={cn(
                        "justify-start rounded-xl text-left font-normal",
                        !selectedDue && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                      {selectedDue
                        ? selectedDue.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDue ?? undefined}
                      onSelect={(date) =>
                        update("dueDate", date ? toISODate(date) : "")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                    <div className="border-t border-border/50 p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-lg text-xs"
                        onClick={() => update("dueDate", "")}
                      >
                        Clear due date
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignee" className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Assignee
              </Label>
              <Select
                value={form.assignee}
                onValueChange={(v) => update("assignee", v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {user && (
                    <SelectItem value={user.name}>
                      {user.name} (you)
                    </SelectItem>
                  )}
                  {members.map((m) => (
                    <SelectItem key={m.email} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-app-primary hover:bg-app-primary/90">
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
