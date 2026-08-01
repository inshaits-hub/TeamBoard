import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Task } from "./types";
import { LABELS, PRIORITIES } from "./types";

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export function TaskEditModal({ task, onClose, onSave }: TaskEditModalProps) {
  const { user, listMembers } = useAuth();
  const [members, setMembers] = useState<Array<{ name: string; email: string }>>([]);
  const [draft, setDraft] = useState(task);

  // reset the draft if a different task is opened
  useEffect(() => {
    setDraft(task);
  }, [task]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    listMembers().then((data) => {
      setMembers(data.map((m) => ({ name: m.name, email: m.email })));
    }).catch(() => {});
  }, [listMembers]);

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div
  className="
    relative z-10
    w-[95vw]
    max-w-md
    max-h-[90vh]
    overflow-y-auto
    overflow-x-hidden
    rounded-3xl
    border
    border-app-primary/20
    bg-app-card
    p-6
    shadow-2xl
  "
>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-card-foreground">
            Edit task
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-app-card-foreground">
              Title
            </label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="
                w-full
                h-10 rounded-xl border border-app-primary/30 bg-app-bg px-3
                text-sm text-app-card-foreground outline-none
                focus:border-app-primary
              "
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-app-card-foreground">
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              rows={3}
              className="
                resize-none rounded-xl border border-app-primary/30 bg-app-bg
                px-3 py-2 text-sm text-app-card-foreground outline-none
                focus:border-app-primary
              "
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-medium text-app-card-foreground">
                Label
              </label>
              <select
                value={draft.label}
                onChange={(e) =>
                  setDraft({ ...draft, label: e.target.value as Task["label"] })
                }
                className="
                  w-full
                  h-10 rounded-xl border border-app-primary/30 bg-app-bg px-2
                  text-sm text-app-card-foreground outline-none
                  focus:border-app-primary
                "
              >
                {Object.entries(LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-app-card-foreground">
                Priority
              </label>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as Task["priority"],
                  })
                }
                className="
                  w-full
                  h-10 rounded-xl border border-app-primary/30 bg-app-bg px-2
                  text-sm text-app-card-foreground outline-none
                  focus:border-app-primary
                "
              >
                {Object.entries(PRIORITIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5 min-w-0">
              <label className="text-xs font-medium text-app-card-foreground">
                Due date
              </label>
              <input
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                className="
                   w-full
                  h-10 rounded-xl border border-app-primary/30 bg-app-bg px-3
                  text-sm text-app-card-foreground outline-none
                  focus:border-app-primary
                "
              />
            </div>

            <div className="grid gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-app-card-foreground">
                <Users className="h-3 w-3 text-muted-foreground" />
                Assignee
              </label>
              <select
                value={draft.assignee}
                onChange={(e) =>
                  setDraft({ ...draft, assignee: e.target.value })
                }
                className="
                  w-full
                  h-10 rounded-xl border border-app-primary/30 bg-app-bg px-2
                  text-sm text-app-card-foreground outline-none
                  focus:border-app-primary
                "
              >
                {user && (
                  <option value={user.name}>{user.name} (you)</option>
                )}
                {members.map((m) => (
                  <option key={m.email} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="rounded-xl text-sm text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-app-primary text-sm font-semibold text-app-primary-foreground hover:opacity-90"
            onClick={handleSave}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}