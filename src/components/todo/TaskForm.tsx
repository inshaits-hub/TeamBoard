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
  dueDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  assignee: "Me",
  comments: 0,
  attachments: 0,
};

export function TaskForm({ task, open, onOpenChange, onSave }: TaskFormProps) {
  const [form, setForm] = useState<Omit<Task, "id" | "createdAt">>(DEFAULT_TASK);

  useEffect(() => {
    if (task) {
      const { id, createdAt, ...rest } = task;
      setForm(rest);
    } else {
      setForm(DEFAULT_TASK);
    }
  }, [task, open]);

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
                <Input
                  id="dueDate"
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                  placeholder="Nov 24"
                  className="rounded-xl"
                />
              </div>
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
