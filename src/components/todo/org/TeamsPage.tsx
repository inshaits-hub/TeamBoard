import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Users2, Plus, Pencil, Trash2, FolderKanban, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orgApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import type { Team } from "@/lib/orgTypes";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface FormState {
  name: string;
  description: string;
  department: string;
  parent: string;
  leader: string;
  projects: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  department: "",
  parent: "",
  leader: "",
  projects: [],
};

export function TeamsPage() {
  const { token, isOnline } = useAuth();
  const { teams, departments, members, projects, refresh } = useOrg();
  const [list, setList] = useState<Team[]>(teams);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => setList(teams), [teams]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    setForm({
      name: team.name,
      description: team.description,
      department: team.department ?? "",
      parent: team.parent ?? "",
      leader: team.leader ?? "",
      projects: team.projects ?? [],
    });
    setOpen(true);
  };

  const toggleProject = (id: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.includes(id)
        ? prev.projects.filter((p) => p !== id)
        : [...prev.projects, id],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        department: form.department || null,
        parent: form.parent || null,
        leader: form.leader || null,
        projects: form.projects,
      };
      if (editing) {
        await orgApi.updateTeam(token, editing.id, payload);
        toast.success("Team updated");
      } else {
        await orgApi.createTeam(token, payload);
        toast.success("Team created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save team");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(
    async (team: Team) => {
      if (!token) return;
      if (!window.confirm(`Delete team "${team.name}"? Memberships on this team will be removed.`))
        return;
      try {
        await orgApi.deleteTeam(token, team.id);
        toast.success("Team deleted");
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete team");
      }
    },
    [token, refresh]
  );

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";
  const leaderName = (id: string | null) => members.find((m) => m.userId === id)?.name ?? "—";
  const projectNames = (ids: string[]) =>
    ids.length === 0
      ? "No projects"
      : ids.map((id) => projects.find((p) => p.id === id)?.name ?? "?").join(", ");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Users2}
        title="Teams"
        description="Organize members into delivery teams"
        action={
          isOnline && (
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-full text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Team
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-4xl">
          {!isOnline ? (
            <OfflineNotice />
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
              <Users2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">No teams yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a team and invite members to get started.</p>
              <Button onClick={openCreate} size="sm" className="mt-4 gap-1.5 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" />
                New Team
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((team) => (
                <Card key={team.id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-app-card-foreground">
                          {team.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {team.description || "No description"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(team)} aria-label={`Edit ${team.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete(team)} aria-label={`Delete ${team.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <UserCircle2 className="h-3 w-3" />
                        Leader: <span className="font-medium text-app-card-foreground">{leaderName(team.leader)}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users2 className="h-3 w-3" />
                        {team.memberCount} member{team.memberCount !== 1 ? "s" : ""} · {deptName(team.department)} dept
                      </p>
                      <p className="flex items-center gap-1.5">
                        <FolderKanban className="h-3 w-3" />
                        <span className="truncate">{projectNames(team.projects)}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg rounded-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Team" : "New Team"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">Name</Label>
                <Input
                  id="team-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Platform Squad"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-desc">Description</Label>
                <Textarea
                  id="team-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Team mission"
                  className="rounded-xl"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="No department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Parent team</Label>
                <Select value={form.parent} onValueChange={(v) => setForm({ ...form, parent: v })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {list
                      .filter((t) => t.id !== editing?.id)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Team leader</Label>
                <Select value={form.leader} onValueChange={(v) => setForm({ ...form, leader: v })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="No leader assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No leader assigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>{m.name} ({m.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Projects</Label>
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/40 p-3">
                  {projects.length === 0 && (
                    <p className="text-xs text-muted-foreground">No projects available yet.</p>
                  )}
                  {projects.map((p) => {
                    const active = form.projects.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProject(p.id)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          active
                            ? "bg-app-primary text-app-primary-foreground"
                            : "bg-app-muted text-muted-foreground hover:bg-app-primary/20"
                        }`}
                      >
                        {p.key} · {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-app-primary hover:bg-app-primary/90">
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

