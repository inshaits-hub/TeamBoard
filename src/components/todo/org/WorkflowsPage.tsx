import { useState } from "react";
import { toast } from "sonner";
import { Workflow, Plus, Pencil, Trash2, Zap, ToggleLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "./PageHeader";
import { OfflineNotice } from "./OfflineNotice";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
}

const SAMPLE_RULES: AutomationRule[] = [
  {
    id: "1",
    name: "Escalate overdue tasks",
    trigger: "Due date passed",
    condition: "task.status != done",
    action: "Notify team lead + bump priority",
    enabled: true,
  },
  {
    id: "2",
    name: "Auto-assign new tickets",
    trigger: "task.created",
    condition: "task.assignee == empty",
    action: "Round-robin assignment",
    enabled: true,
  },
  {
    id: "3",
    name: "Sprint start housekeeping",
    trigger: "sprint.starts",
    condition: "sprint.backlog > 0",
    action: "Create recurring work items",
    enabled: false,
  },
];

const TRIGGERS = ["task.created", "task.updated", "due date passed", "sprint.starts", "milestone.reached"];
const ACTIONS = [
  "Notify stakeholders",
  "Escalate to team lead",
  "Bump priority",
  "Auto-assign task",
  "Create recurring work item",
  "Trigger approval",
  "Sync external system",
];

export function WorkflowsPage() {
  const { isOnline } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>(SAMPLE_RULES);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState({ name: "", trigger: TRIGGERS[0], condition: "", action: ACTIONS[0] });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", trigger: TRIGGERS[0], condition: "", action: ACTIONS[0] });
    setOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditing(rule);
    setForm({ name: rule.name, trigger: rule.trigger, condition: rule.condition, action: rule.action });
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      setRules((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...form } : r))
      );
      toast.success("Automation updated");
    } else {
      setRules((prev) => [
        { id: String(Date.now()), ...form, enabled: true },
        ...prev,
      ]);
      toast.success("Automation created");
    }
    setOpen(false);
  };

  const handleDelete = (rule: AutomationRule) => {
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    toast.success("Automation deleted");
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={Workflow}
        title="Workflows"
        description="Rule-based automation for assignments, escalations and notifications"
        action={
          isOnline && (
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-full text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Automation
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-4xl">
          {!isOnline ? (
            <OfflineNotice />
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} className="border-border/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Zap className={`h-4 w-4 ${rule.enabled ? "text-app-primary" : "text-muted-foreground"}`} />
                      {rule.name}
                      {rule.enabled ? (
                        <Badge variant="secondary" className="rounded-full text-[10px] text-emerald-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-[10px]">Paused</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} aria-label={`Toggle ${rule.name}`} />
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(rule)} aria-label={`Edit ${rule.name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rule)} aria-label={`Delete ${rule.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-app-muted px-2.5 py-1 font-medium text-app-card-foreground">
                        when {rule.trigger}
                      </span>
                      {rule.condition && (
                        <>
                          <span className="text-muted-foreground/50">if</span>
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-600">
                            {rule.condition}
                          </span>
                        </>
                      )}
                      <ArrowRight className="h-3 w-3" />
                      <span className="rounded-full bg-app-primary/10 px-2.5 py-1 font-medium text-app-primary">
                        {rule.action}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="rounded-xl border border-dashed border-border/40 px-6 py-6 text-center">
                <ToggleLeft className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-app-card-foreground">Rule-based automation</p>
                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                  Automatically assign tasks, escalate overdue issues, notify stakeholders, trigger approvals and
                  execute custom actions without manual intervention.
                </p>
                <Button onClick={openCreate} size="sm" variant="outline" className="mt-4 gap-1.5 rounded-full text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Build a workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Automation" : "New Automation"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rule-name">Name</Label>
                <Input id="rule-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Escalate overdue tasks" className="rounded-xl" required />
              </div>
              <div className="grid gap-2">
                <Label>Trigger</Label>
                <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rule-condition">Condition (optional)</Label>
                <Input id="rule-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="task.status != done" className="rounded-xl font-mono text-xs" />
              </div>
              <div className="grid gap-2">
                <Label>Action</Label>
                <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-app-primary hover:bg-app-primary/90">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

