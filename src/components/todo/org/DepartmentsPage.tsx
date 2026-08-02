import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Layers, Users2 } from "lucide-react";
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
import type { Department } from "@/lib/orgTypes";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface FormState {
  name: string;
  description: string;
  parent: string;
  head: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", parent: "", head: "" };

export function DepartmentsPage() {
  const { token, isOnline } = useAuth();
  const { departments, members, refresh } = useOrg();
  const [list, setList] = useState<Department[]>(departments);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => setList(departments), [departments]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description,
      parent: dept.parent ?? "",
      head: dept.head ?? "",
    });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        parent: form.parent || null,
        head: form.head || null,
      };
      if (editing) {
        await orgApi.updateDepartment(token, editing.id, payload);
        toast.success("Department updated");
      } else {
        await orgApi.createDepartment(token, payload);
        toast.success("Department created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(
    async (dept: Department) => {
      if (!token) return;
      if (!window.confirm(`Delete department "${dept.name}"? Its teams and projects will be detached.`))
        return;
      try {
        await orgApi.deleteDepartment(token, dept.id);
        toast.success("Department deleted");
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete department");
      }
    },
    [token, refresh]
  );

  const headName = (id: string | null) => members.find((m) => m.userId === id)?.name ?? "—";

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Building2}
        title="Departments"
        description="Structure your organization into departments"
        action={
          isOnline && (
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-full text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Department
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
              <Building2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">No departments yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first department to organize teams and projects.</p>
              <Button onClick={openCreate} size="sm" className="mt-4 gap-1.5 rounded-full text-xs">
                <Plus className="h-3.5 w-3.5" />
                New Department
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((dept) => (
                <Card key={dept.id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-app-card-foreground">
                          {dept.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {dept.description || "No description"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(dept)} aria-label={`Edit ${dept.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete(dept)} aria-label={`Delete ${dept.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {dept.projectCount} projects
                      </span>
                      <span className="flex items-center gap-1">
                        <Users2 className="h-3 w-3" /> {dept.teamCount} teams
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-app-muted px-2 py-0.5">
                        Head: {headName(dept.head)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Department" : "New Department"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dept-name">Name</Label>
                <Input
                  id="dept-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Engineering"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dept-desc">Description</Label>
                <Textarea
                  id="dept-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this department own?"
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Parent department</Label>
                <Select value={form.parent} onValueChange={(v) => setForm({ ...form, parent: v })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {list
                      .filter((d) => d.id !== editing?.id)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department head</Label>
                <Select value={form.head} onValueChange={(v) => setForm({ ...form, head: v })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="No head assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No head assigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

