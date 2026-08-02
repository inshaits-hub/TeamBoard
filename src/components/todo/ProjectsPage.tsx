import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  FolderKanban,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PROJECT_STATUS_META, type Project, type ProjectStatus } from "@/lib/orgTypes";
import type { Task } from "./types";
import { getDueMeta } from "./dueDate";
import { PageHeader } from "./org/PageHeader";
import { OfflineNotice } from "./org/OfflineNotice";

interface ProjectsPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
}

interface FormState {
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  department: string;
  lead: string;
  startDate: string;
  targetDate: string;
  color: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  key: "",
  description: "",
  status: "planning",
  department: "",
  lead: "",
  startDate: "",
  targetDate: "",
  color: "violet",
};

const COLORS = ["violet", "blue", "emerald", "amber", "rose", "indigo"];

export function ProjectsPage({ tasks, onAddTask, onOpenTask }: ProjectsPageProps) {
  const { user, token, isOnline } = useAuth();
  const { projects, departments, members, refresh } = useOrg();
  const [list, setList] = useState<Project[]>(projects);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => setList(projects), [projects]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status,
      department: project.department ?? "",
      lead: project.lead ?? "",
      startDate: project.startDate ?? "",
      targetDate: project.targetDate ?? "",
      color: project.color ?? "violet",
    });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.name.trim() || !form.key.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        key: form.key.trim().toUpperCase(),
        description: form.description,
        status: form.status,
        department: form.department || null,
        lead: form.lead || null,
        startDate: form.startDate,
        targetDate: form.targetDate,
        color: form.color,
      };
      if (editing) {
        await orgApi.updateProject(token, editing.id, payload);
        toast.success("Project updated");
      } else {
        await orgApi.createProject(token, payload);
        toast.success("Project created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!token) return;
    if (!window.confirm(`Delete project "${project.name}"? Its tasks will also be removed.`)) return;
    try {
      await orgApi.deleteProject(token, project.id);
      toast.success("Project deleted");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.column !== "done" && getDueMeta(t).tone === "overdue").length,
    [tasks]
  );
  const upcomingCount = useMemo(
    () => tasks.filter((t) => t.column !== "done" && getDueMeta(t).tone === "soon").length,
    [tasks]
  );
  const doneCount = useMemo(() => tasks.filter((t) => t.column === "done").length, [tasks]);

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";
  const leadName = (id: string | null) => members.find((m) => m.userId === id)?.name ?? "—";

  const projectTaskCount = (id: string | null) =>
    id ? tasks.filter((t) => t.label === (list.find((p) => p.id === id)?.key.toLowerCase() ?? "")).length : 0;

  const projectProgress = (project: Project) => {
    const key = project.key.toLowerCase();
    const all = tasks.filter((t) => t.label === key);
    if (all.length === 0) return 0;
    return Math.round((all.filter((t) => t.column === "done").length / all.length) * 100);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={FolderKanban}
        title="Projects"
        description="Delivery projects, milestones and progress"
        action={
          isOnline && (
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-full text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          )
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 border-b border-border/40 px-6 py-4 sm:grid-cols-4">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-primary/10">
              <FolderKanban className="h-4 w-4 text-app-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">{list.length}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">{doneCount}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">{overdueCount}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
              <ArrowRight className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-app-card-foreground">{upcomingCount}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Due soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-5xl">
          {!isOnline ? (
            <OfflineNotice />
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
              <Briefcase className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">No projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a project to start organizing work streams.</p>
              <Button onClick={openCreate} size="sm" className="mt-4 gap-1.5 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((project) => {
                const status = PROJECT_STATUS_META[project.status];
                const progress = projectProgress(project);
                const taskCount = projectTaskCount(project.id);
                return (
                  <Card key={project.id} className="border-border/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 rounded-full bg-${project.color}-500`} />
                        {project.name}
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          {project.key}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge className={`rounded-full text-[10px] ${status.tone}`}>{status.label}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(project)} aria-label={`Edit ${project.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete(project)} aria-label={`Delete ${project.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={progress} className="h-2" />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {project.startDate || "—"} → {project.targetDate || "—"}
                        </span>
                        <span>{taskCount} linked tasks · {progress}%</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-app-muted px-2 py-0.5">Dept: {deptName(project.department)}</span>
                        <span className="rounded-full bg-app-muted px-2 py-0.5">Lead: {leadName(project.lead)}</span>
                      </div>
                      {user && (
                        <button
                          onClick={() => onAddTask()}
                          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-app-bg/80"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add task to {project.name}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg rounded-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="proj-name">Name</Label>
                  <Input id="proj-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website Redesign" className="rounded-xl" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proj-key">Key</Label>
                  <Input id="proj-key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })} placeholder="WEB" className="rounded-xl uppercase" maxLength={10} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proj-desc">Description</Label>
                <Textarea id="proj-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_STATUS_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Lead</Label>
                  <Select value={form.lead} onValueChange={(v) => setForm({ ...form, lead: v })}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.map((m) => <SelectItem key={m.userId} value={m.userId}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="proj-start">Start date</Label>
                  <Input id="proj-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="proj-target">Target date</Label>
                  <Input id="proj-target" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
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

