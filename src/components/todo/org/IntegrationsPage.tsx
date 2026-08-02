import { useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Webhook,
  GitBranch,
  Database,
  Cloud,
  MessageSquare,
  CalendarClock,
  Mail,
  Github,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  category: "devops" | "communication" | "cloud" | "productivity";
}

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "github", name: "GitHub", description: "Link repos, PRs and CI status to tasks", icon: Github, connected: true, category: "devops" },
  { id: "gitlab", name: "GitLab", description: "Mirror issues and merge requests", icon: GitBranch, connected: false, category: "devops" },
  { id: "bitbucket", name: "Bitbucket", description: "Track pipelines and pull requests", icon: GitBranch, connected: false, category: "devops" },
  { id: "slack", name: "Slack", description: "Send notifications and updates to channels", icon: MessageSquare, connected: false, category: "communication" },
  { id: "teams", name: "Microsoft Teams", description: "Post work updates to team channels", icon: MessageSquare, connected: false, category: "communication" },
  { id: "google-calendar", name: "Google Calendar", description: "Sync sprints, milestones and due dates", icon: CalendarClock, connected: false, category: "productivity" },
  { id: "outlook", name: "Outlook / Email", description: "Email digests and @mentions", icon: Mail, connected: false, category: "productivity" },
  { id: "aws", name: "AWS", description: "Deployments and environment health", icon: Cloud, connected: false, category: "cloud" },
  { id: "kubernetes", name: "Kubernetes", description: "Cluster and workload monitoring", icon: Database, connected: false, category: "cloud" },
  { id: "docker", name: "Docker", description: "Container builds and registries", icon: Database, connected: false, category: "devops" },
];

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const SECURITY_POLICIES: SecurityPolicy[] = [
  { id: "mfa", name: "Multi-factor authentication", description: "Require MFA for all members at sign-in.", enabled: false },
  { id: "sso", name: "Single sign-on (SSO)", description: "Sign in with your identity provider (SAML/OIDC).", enabled: false },
  { id: "audit", name: "Audit logging", description: "Record every privileged action for compliance.", enabled: true },
  { id: "invite-approval", name: "Invitation approval", description: "Require an admin to approve new invitations.", enabled: false },
];

export function IntegrationsPage() {
  const { isOnline } = useAuth();
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [policies, setPolicies] = useState(SECURITY_POLICIES);

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, connected: !i.connected };
        toast.success(
          next.connected
            ? `${next.name} connected`
            : `${next.name} disconnected`
        );
        return next;
      })
    );
  };

  const togglePolicy = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
    toast.success("Security policy updated");
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Plug}
        title="Security & Integrations"
        description="Security policies, webhooks and third-party integrations"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          {!isOnline && <OfflineNotice />}

          {/* Security policies */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-app-primary" />
              <h3 className="text-sm font-semibold text-app-card-foreground">Security policies</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {policies.map((policy) => (
                <Card key={policy.id} className="border-border/40">
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-primary/10">
                        {policy.id === "mfa" ? (
                          <Fingerprint className="h-4 w-4 text-app-primary" />
                        ) : policy.id === "sso" ? (
                          <KeyRound className="h-4 w-4 text-app-primary" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-app-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-app-card-foreground">{policy.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
                      </div>
                    </div>
                    <Switch checked={policy.enabled} onCheckedChange={() => togglePolicy(policy.id)} aria-label={policy.name} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Webhooks */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Webhook className="h-4 w-4 text-app-primary" />
              <h3 className="text-sm font-semibold text-app-card-foreground">Webhooks & API</h3>
              <Badge variant="secondary" className="rounded-full text-[10px]">REST · GraphQL</Badge>
            </div>
            <Card className="border-border/40">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-primary/10">
                    <Plug className="h-4 w-4 text-app-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-app-card-foreground">Programmatic access</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      REST and GraphQL endpoints are ready. Generate an API token to sync external systems.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => toast.info("API token flow coming next")}>
                  <KeyRound className="h-3.5 w-3.5" />
                  Generate token
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Integrations */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Plug className="h-4 w-4 text-app-primary" />
              <h3 className="text-sm font-semibold text-app-card-foreground">Integrations</h3>
              <span className="text-xs text-muted-foreground">
                {integrations.filter((i) => i.connected).length} connected
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="border-border/40">
                    <CardContent className="flex items-start justify-between gap-3 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-primary/10">
                          <Icon className="h-4 w-4 text-app-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-app-card-foreground">{integration.name}</p>
                            {integration.connected && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <Switch checked={integration.connected} onCheckedChange={() => toggleIntegration(integration.id)} aria-label={`Toggle ${integration.name}`} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

