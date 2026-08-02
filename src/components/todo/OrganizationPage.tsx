import { lazy, Suspense } from "react";
import type { PageId } from "./AppSidebar";
import { OrganizationSettingsPage } from "./org/OrganizationSettingsPage";
import { DepartmentsPage } from "./org/DepartmentsPage";
import { TeamsPage } from "./org/TeamsPage";
import { RolesPage } from "./org/RolesPage";
import { WorkflowsPage } from "./org/WorkflowsPage";
import { IntegrationsPage } from "./org/IntegrationsPage";
import type { Task } from "./types";

// Lazy import to avoid pulling recharts into the critical path for non-analytics pages.
const AnalyticsPage = lazy(() =>
  import("./org/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);

interface OrganizationPageProps {
  page: PageId;
  tasks?: Task[];
}

/**
 * Dispatches each organization sub-page to its fully functional component.
 * `tasks` is optional and only used by analytics views that need task data.
 */
export function OrganizationPage({ page, tasks = [] }: OrganizationPageProps) {
  switch (page) {
    case "org-departments":
      return <DepartmentsPage />;
    case "org-teams":
      return <TeamsPage />;
    case "org-roles":
      return <RolesPage />;
    case "org-analytics":
      return <AnalyticsPage tasks={tasks} />;
    case "org-workflows":
      return <WorkflowsPage />;
    case "org-integrations":
      return <IntegrationsPage />;
    case "org-settings":
    default:
      return <OrganizationSettingsPage />;
  }
}

export function OrganizationPageSuspense(props: OrganizationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-primary border-t-transparent" />
        </div>
      }
    >
      <OrganizationPage {...props} />
    </Suspense>
  );
}

