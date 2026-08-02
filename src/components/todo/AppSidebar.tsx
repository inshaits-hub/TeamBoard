import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListChecks,
  UserCircle,
  Settings,
  ShieldCheck,
  BarChart3,
  Workflow,
  Plug,
  Building2,
  Users2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TeamBoardLogo } from "./TeamBoardLogo";
import { usePermission } from "@/hooks/usePermission";
import type { Permission } from "@/lib/permissions";

export type PageId =
  | "dashboard"
  | "members"
  | "projects"
  | "tasks"
  | "profile"
  | "org-settings"
  | "org-departments"
  | "org-teams"
  | "org-roles"
  | "org-analytics"
  | "org-workflows"
  | "org-integrations";

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Permission required to see this item. Items are hidden (not disabled)
   * when the current role lacks it. Omit for always-visible items.
   */
  requiredPermission?: Permission;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Organization",
    items: [
      {
        id: "org-settings",
        label: "Settings",
        icon: Settings,
        requiredPermission: "org:update",
      },
      {
        id: "org-departments",
        label: "Departments",
        icon: Building2,
        requiredPermission: "department:view",
      },
      {
        id: "org-teams",
        label: "Teams",
        icon: Users2,
        requiredPermission: "team:view",
      },
      {
        id: "org-roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        requiredPermission: "role:view",
      },
      {
        id: "org-analytics",
        label: "Analytics",
        icon: BarChart3,
        requiredPermission: "analytics:view",
      },
      {
        id: "org-workflows",
        label: "Workflows",
        icon: Workflow,
        requiredPermission: "automation:view",
      },
      {
        id: "org-integrations",
        label: "Security & Integrations",
        icon: Plug,
        requiredPermission: "integration:view",
      },
    ],
  },
  {
    title: "Team Management",
    items: [
      {
        id: "members",
        label: "Members",
        icon: Users,
        requiredPermission: "member:view",
      },
      {
        id: "projects",
        label: "Projects",
        icon: FolderKanban,
        requiredPermission: "project:view",
      },
    ],
  },
  {
    title: "My Work",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        requiredPermission: "task:view",
      },
      {
        id: "tasks",
        label: "My Tasks",
        icon: ListChecks,
        requiredPermission: "task:view",
      },
      {
        id: "profile",
        label: "Profile",
        icon: UserCircle,
      },
    ],
  },
];

/** Returns sections with items the role can see; empty sections are dropped. */
export function getVisibleSections(
  can: (permission: Permission) => boolean
): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.requiredPermission || can(item.requiredPermission)
    ),
  })).filter((section) => section.items.length > 0);
}

/** Whether the given page is reachable with the current permission set. */
export function canViewPage(
  page: PageId,
  can: (permission: Permission) => boolean
): boolean {
  const item = NAV_SECTIONS.flatMap((section) => section.items).find(
    (entry) => entry.id === page
  );
  return !item?.requiredPermission || can(item.requiredPermission);
}

interface AppSidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { can } = usePermission();
  const sections = getVisibleSections(can);

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
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
