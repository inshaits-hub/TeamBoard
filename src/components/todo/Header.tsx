import {
  CalendarDays,
  CheckSquare,
  CloudOff,
  Download,
  Keyboard,
  LayoutGrid,
  List,
  LogOut,
  MoreVertical,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { User } from "@/contexts/AuthContext";
import type { ViewMode } from "./useTaskStore";

interface HeaderProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddTask: () => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  onExport: () => void;
  onImport: () => void;
  onShowShortcuts: () => void;
  user: User | null;
  onSignOutClick: () => void;
  /** False when the app is running against localStorage only. */
  online: boolean;
}

export function Header({
  view,
  onViewChange,
  onAddTask,
  selectionMode,
  onToggleSelectionMode,
  onExport,
  onImport,
  onShowShortcuts,
  user,
  onSignOutClick,
  online,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-app-bg/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-app-primary text-app-primary-foreground"
            aria-hidden="true"
          >
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight text-app-card-foreground">
              Homepage Design
            </h1>
            <p className="text-xs text-muted-foreground">Project board</p>
          </div>
        </div>

        <nav aria-label="Board actions" className="flex items-center gap-2 sm:gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && onViewChange(v as ViewMode)}
            className="rounded-full border border-border/50 bg-app-card p-1"
            aria-label="Switch view"
          >
            <ToggleGroupItem
              value="board"
              aria-label="Board view"
              className="rounded-full px-3 py-2 text-xs data-[state=on]:bg-app-primary data-[state=on]:text-app-primary-foreground"
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="rounded-full px-3 py-2 text-xs data-[state=on]:bg-app-primary data-[state=on]:text-app-primary-foreground"
            >
              <List className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calendar"
              aria-label="Calendar view"
              className="rounded-full px-3 py-2 text-xs data-[state=on]:bg-app-primary data-[state=on]:text-app-primary-foreground"
            >
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Calendar
            </ToggleGroupItem>
          </ToggleGroup>

          {!online && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-app-muted px-3 py-1.5 text-[11px] text-muted-foreground md:inline-flex"
              title="No API configured — tasks are stored in this browser only"
            >
              <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
              Offline mode
            </span>
          )}

          <div className="hidden items-center -space-x-2 lg:flex" aria-hidden="true">
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
          </div>

          <ThemeSwitcher />

          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={onToggleSelectionMode}
            aria-pressed={selectionMode}
            className="h-11 gap-1.5 rounded-full px-3 text-sm"
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Select</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                aria-label="Data and help menu"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Your data</DropdownMenuLabel>
              <DropdownMenuItem onSelect={onExport}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Export tasks (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImport}>
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                Import tasks (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onShowShortcuts}>
                <Keyboard className="mr-2 h-4 w-4" aria-hidden="true" />
                Keyboard shortcuts
              </DropdownMenuItem>
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onSignOutClick}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Avatar className="h-9 w-9 border-2 border-app-primary/30">
              <AvatarFallback className="bg-app-primary text-app-primary-foreground text-xs">
                {user.initials}
              </AvatarFallback>
            </Avatar>
          )}

          <Button
            onClick={onAddTask}
            className="h-11 gap-1.5 rounded-full bg-app-primary px-4 text-sm text-app-primary-foreground hover:bg-app-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sr-only sm:hidden">Add task</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
