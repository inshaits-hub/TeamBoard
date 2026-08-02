import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { orgApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { ORG_PLANS, type OrgPlan } from "@/lib/orgTypes";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

export function OrganizationSettingsPage() {
  const { token, isOnline } = useAuth();
  const { organization, isLoaded, refresh, context } = useOrg();

  const [name, setName] = useState(organization.name);
  const [plan, setPlan] = useState<OrgPlan>(organization.plan);
  const [timezone, setTimezone] = useState(organization.settings.timezone);
  const [weekStartsOn, setWeekStartsOn] = useState(organization.settings.weekStartsOn);
  const [requireApproval, setRequireApproval] = useState(
    organization.settings.requireApprovalForInvites
  );
  const [enforceMfa, setEnforceMfa] = useState(organization.settings.enforceMfa);
  const [saving, setSaving] = useState(false);

  // Keep local form in sync when the org context loads/changes.
  useEffect(() => {
    setName(organization.name);
    setPlan(organization.plan);
    setTimezone(organization.settings.timezone);
    setWeekStartsOn(organization.settings.weekStartsOn);
    setRequireApproval(organization.settings.requireApprovalForInvites);
    setEnforceMfa(organization.settings.enforceMfa);
  }, [organization]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await orgApi.updateOrganization(token, {
        name,
        plan,
        settings: { timezone, weekStartsOn, requireApprovalForInvites: requireApproval, enforceMfa },
      });
      toast.success("Organization settings saved");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const counts = context.counts;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Building2}
        title="Organization Settings"
        description="Profile, plan and workspace preferences"
        action={
          isOnline && (
            <Button onClick={handleSave} disabled={saving || !isLoaded} className="h-9 gap-1.5 rounded-full text-xs">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {!isOnline && <OfflineNotice />}

          {/* Overview stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Members", counts.members],
              ["Departments", counts.departments],
              ["Teams", counts.teams],
              ["Projects", counts.projects],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/40 bg-app-card p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-app-card-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Profile */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-sm">Workspace profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Acme Inc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-plan">Plan</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as OrgPlan)}>
                  <SelectTrigger id="org-plan" className="w-full rounded-xl">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_PLANS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-sm">Workspace preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org-tz">Timezone</Label>
                <Input
                  id="org-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="rounded-xl"
                  placeholder="UTC"
                />
              </div>
              <div className="grid gap-2">
                <Label>Week starts on</Label>
                <Select
                  value={String(weekStartsOn)}
                  onValueChange={(v) => setWeekStartsOn(Number(v))}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-app-card-foreground">Require approval for invites</p>
                  <p className="text-xs text-muted-foreground">Admins must approve new member invitations.</p>
                </div>
                <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-app-card-foreground">Enforce MFA</p>
                  <p className="text-xs text-muted-foreground">Require multi-factor authentication for all members.</p>
                </div>
                <Switch checked={enforceMfa} onCheckedChange={setEnforceMfa} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

