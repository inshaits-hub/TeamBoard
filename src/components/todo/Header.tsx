import { LayoutGrid, List, Plus, LogOut, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { toggleSidebarPanel, useSidebarPanelOpen } from "./sidebarStore";
import type { User } from "@/contexts/AuthContext";

interface HeaderProps {
  view: "board" | "list";
  onViewChange: (view: "board" | "list") => void;
  onAddTask: () => void;
  user: User | null;
  onSignOutClick: () => void;
  theme: string;
}

export function Header({ view, onViewChange, onAddTask, user, onSignOutClick, theme }: HeaderProps) {
  const isPastel = theme.startsWith("pastel-");
  const isPanelOpen = useSidebarPanelOpen();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-white/40 px-4 py-3 backdrop-blur-2xl dark:bg-black/30 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#3D5A33] text-white shadow-lg">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight text-app-card-foreground">
              Team Task Board
            </h1>
            <p className="text-xs text-muted-foreground">
              {user ? `Welcome, ${user.name}` : "Project board"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && onViewChange(v as "board" | "list")}
            className="rounded-full border border-white/30 bg-white/40 p-1 backdrop-blur-sm dark:bg-white/5"
          >
            <ToggleGroupItem
              value="board"
              aria-label="Board view"
              className="rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-[#3D5A33] data-[state=on]:text-white"
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-[#3D5A33] data-[state=on]:text-white"
            >
              <List className="mr-1.5 h-3.5 w-3.5" />
              List
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebarPanel}
            aria-label={isPanelOpen ? "Hide task progress panel" : "Show task progress panel"}
            className="h-9 w-9 rounded-full border border-[#C6C7A5] bg-[#F8F3E6]/80 text-[#465E20] shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-[#C6C7A5] hover:text-[#3B4F1A] hover:border-[#465E20] focus-visible:ring-2 focus-visible:ring-[#C9A24A] dark:border-[#465E20]/40 dark:bg-[#2C381F]/80 dark:text-[#F8F3E6] dark:hover:bg-[#465E20]"
          >
            {isPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>

          <ThemeSwitcher />

          <Button
            onClick={onAddTask}
            className="h-9 gap-1.5 rounded-full bg-[#3D5A33] px-4 text-sm text-white shadow-lg hover:bg-[#2F4527] hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="h-8 w-8 cursor-pointer border-2 border-white/50 text-[10px] transition-transform hover:scale-105">
                    <AvatarFallback className="bg-[#3D5A33] text-white">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-44 rounded-2xl border border-white/20 bg-white/70 p-2 backdrop-blur-2xl dark:bg-black/60 dark:border-white/10"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-app-card-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/20 dark:bg-white/10" />
                <DropdownMenuItem
                  onClick={onSignOutClick}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}