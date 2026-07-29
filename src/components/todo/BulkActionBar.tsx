import { CheckCircle2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ColumnId, Priority } from "./types";
import { COLUMNS, PRIORITIES } from "./types";

interface BulkActionBarProps {
  count: number;
  onComplete: () => void;
  onMove: (column: ColumnId) => void;
  onPriority: (priority: Priority) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  count,
  onComplete,
  onMove,
  onPriority,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  return (
    <div
      role="region"
      aria-label={`Bulk actions for ${count} selected ${count === 1 ? "task" : "tasks"}`}
      className="sticky bottom-4 z-40 mx-auto mt-4 flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-app-card p-3 shadow-lg"
    >
      <span className="px-1 text-sm font-medium text-app-card-foreground">
        {count} selected
      </span>

      <Button
        variant="outline"
        className="h-9 gap-1.5 rounded-full text-xs"
        onClick={onComplete}
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Mark complete
      </Button>

      <Select onValueChange={(v) => onMove(v as ColumnId)}>
        <SelectTrigger
          className="h-9 w-36 rounded-full text-xs"
          aria-label="Move selected tasks to a column"
        >
          <SelectValue placeholder="Move to..." />
        </SelectTrigger>
        <SelectContent>
          {COLUMNS.map((col) => (
            <SelectItem key={col.id} value={col.id}>
              {col.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onPriority(v as Priority)}>
        <SelectTrigger
          className="h-9 w-36 rounded-full text-xs"
          aria-label="Set priority for selected tasks"
        >
          <SelectValue placeholder="Priority..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRIORITIES).map(([key, p]) => (
            <SelectItem key={key} value={key}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-1.5 rounded-full text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {count} {count === 1 ? "task" : "tasks"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The selected tasks will be removed from your
              board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-9 w-9 rounded-full"
        onClick={onClear}
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
