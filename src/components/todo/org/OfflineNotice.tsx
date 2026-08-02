import { CloudOff } from "lucide-react";

/**
 * Shown in org pages when no API is configured, so the UI still explains
 * why live org data isn't available instead of silently rendering empty.
 */
export function OfflineNotice() {
  return (
    <div className="rounded-xl border border-dashed border-border/40 px-6 py-10 text-center">
      <CloudOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm font-medium text-app-card-foreground">
        Offline demo mode
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        Connect the backend by setting <code className="rounded bg-app-muted px-1">VITE_API_URL</code>{" "}
        to browse departments, teams, projects and roles from your organization.
      </p>
    </div>
  );
}

