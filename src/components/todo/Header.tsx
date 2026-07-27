import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  view: "board" | "list";
  onViewChange: (view: "board" | "list") => void;
  onAddTask: () => void;
}

export function Header({ view, onViewChange, onAddTask }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-app-bg/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-app-primary text-app-primary-foreground">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight text-app-card-foreground">
              Homepage Design
            </h1>
            <p className="text-xs text-muted-foreground">Project board</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && onViewChange(v as "board" | "list")}
            className="rounded-full border border-border/50 bg-app-card p-1"
          >
            <ToggleGroupItem
              value="board"
              aria-label="Board view"
              className="rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-app-primary data-[state=on]:text-app-primary-foreground"
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-app-primary data-[state=on]:text-app-primary-foreground"
            >
              <List className="mr-1.5 h-3.5 w-3.5" />
              List
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="hidden items-center -space-x-2 sm:flex">
            {["A", "B", "C"].map((initial) => (
              <Avatar
                key={initial}
                className="h-8 w-8 border-2 border-app-bg text-[10px]"
              >
                <AvatarFallback className="bg-app-muted text-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
            ))}
            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-app-bg bg-app-card text-[10px] font-medium text-muted-foreground">
              +
            </div>
          </div>

          <Button
            onClick={onAddTask}
            className="h-9 gap-1.5 rounded-full bg-app-primary px-4 text-sm text-app-primary-foreground hover:bg-app-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
