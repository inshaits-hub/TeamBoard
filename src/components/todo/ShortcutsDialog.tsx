import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "/", action: "Focus the search field" },
  { keys: "n", action: "Create a new task" },
  { keys: "s", action: "Toggle selection mode" },
  { keys: "?", action: "Show this shortcuts list" },
  { keys: "Tab", action: "Move between controls and task cards" },
  { keys: "Arrow keys", action: "Move focus between cards and columns" },
  { keys: "Enter", action: "Edit the focused task" },
  { keys: "Space", action: "Select the focused task (selection mode)" },
  { keys: "Delete", action: "Delete the focused task" },
  { keys: "Escape", action: "Clear selection or close a dialog" },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            The whole board can be used without a mouse.
          </DialogDescription>
        </DialogHeader>
        <dl className="divide-y divide-border/50">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between gap-4 py-2"
            >
              <dt className="text-sm text-app-card-foreground">{s.action}</dt>
              <dd>
                <kbd className="rounded-md border border-border/60 bg-app-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
