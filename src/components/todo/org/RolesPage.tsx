import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Plus, Pencil, Trash2, Users2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { RoleInfo } from "@/lib/orgTypes";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface RoleForm {
  name: string;
  description: string;
  rank: number;
  permissions: string[];
}

const EMPTY_FORM: RoleForm = { name: "", description: "", rank: 5, permissions: [] };

export function RolesPage() {
  const { token, isOnline } = useAuth();
  const { roles, refresh } = useOrg();
  const [list, setList] = useState<RoleInfo[]>(roles?.roles ?? []);
  const [catalogue, setCatalogue] = useState(roles?.catalogue ?? { permissions: [], groups: {} });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleInfo | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(roles?.roles ?? []);
    setCatalogue(roles?.catalogue ?? { permissions: [], groups: {} });
  }, [roles]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (role: RoleInfo) => {
    if (role.isSystem) {
      toast.info("System roles cannot be edited");
      return;
    }
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description,
      rank: role.rank,
      permissions: role.permissions ?? [],
    });
    setOpen(true);
  };

  const togglePermission = (permission: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
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
        rank: form.rank,
        permissions: form.permissions,
      };
      if (editing) {
        await orgApi.updateRole(token, editing.id, payload);
        toast.success("Role updated");
      } else {
        await orgApi.createRole(token, payload);
        toast.success("Role created");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(
    async (role: RoleInfo) => {
      if (!token || role.isSystem) return;
      if (!window.confirm(`Delete role "${role.name}"?`)) return;
      try {
        await orgApi.deleteRole(token, role.id);
        toast.success("Role deleted");
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete role");
      }
    },
    [token, refresh]
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={ShieldCheck}
        title="Roles & Permissions"
        description="Custom roles and granular RBAC access control"
        action={
          isOnline && (
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-full text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Role
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
              <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">No roles found</p>
              <p className="mt-1 text-xs text-muted-foreground">System roles will appear here once the API is connected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((role) => (
                <Card key={role.id} className="border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {role.isSystem ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
                      {role.name}
                      {role.isSystem ? (
                        <Badge variant="secondary" className="rounded-full text-[10px]">System</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-[10px]">Custom</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-app-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Users2 className="h-3 w-3" />
                        {role.memberCount}
                      </span>
                      {!role.isSystem && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(role)} aria-label={`Edit ${role.name}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete(role)} aria-label={`Delete ${role.name}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(role.permissions ?? []).slice(0, 8).map((p) => (
                        <span key={p} className="rounded-full bg-app-primary/10 px-2 py-0.5 text-[10px] font-medium text-app-primary">
                          {p}
                        </span>
                      ))}
                      {(role.permissions ?? []).length > 8 && (
                        <span className="rounded-full bg-app-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{(role.permissions ?? []).length - 8} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit dialog with permission matrix */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl rounded-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? `Edit ${editing.name}` : "New Role"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="role-name">Name</Label>
                  <Input id="role-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-rank">Rank (0 = highest)</Label>
                  <Input id="role-rank" type="number" min={0} max={10} value={form.rank} onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-desc">Description</Label>
                <Textarea id="role-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" rows={2} />
              </div>

              <div className="grid gap-1">
                <Label>Permissions</Label>
                <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border/40 p-3">
                  {Object.entries(catalogue.groups).map(([group, perms]) => (
                    <div key={group}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {group}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((permission) => {
                          const active = form.permissions.includes(permission);
                          return (
                            <label
                              key={permission}
                              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                active
                                  ? "border-app-primary/40 bg-app-primary/10 text-app-primary"
                                  : "border-border/40 bg-app-bg/50 text-muted-foreground hover:bg-app-muted"
                              }`}
                            >
                              <Checkbox
                                checked={active}
                                onCheckedChange={() => togglePermission(permission)}
                                className="h-3.5 w-3.5"
                              />
                              {permission}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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

