import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListChecks,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TeamBoardLogo } from "./TeamBoardLogo";

export type PageId = "dashboard" | "members" | "projects" | "tasks" | "profile";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "profile", label: "Profile", icon: UserCircle },
];

interface AppSidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 py-3">
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-sidebar-accent"
          aria-label="Go to dashboard"
        >
          <TeamBoardLogo size="sm" />
          <span className="text-sm font-semibold text-app-card-foreground group-data-[collapsible=icon]:hidden">
            Team Board
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentPage === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}