import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Users, Plus, Mail, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, type TeamMember } from "@/contexts/AuthContext";

export function MembersPage() {
  const { user, createMember, listMembers, deleteMember } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchMembers = useCallback(async () => {
    setFetching(true);
    const data = await listMembers();
    setMembers(data);
    setFetching(false);
  }, [listMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const success = await createMember(newName.trim(), newEmail.trim(), newPassword);
      if (success) {
        toast.success(`${newName.trim()} added to team`);
        setFormOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        fetchMembers();
      } else {
        toast.error("Failed to add team member");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const confirmed = window.confirm(`Remove ${name} from the team?`);
    if (!confirmed) return;

    try {
      const success = await deleteMember(id);
      if (success) {
        toast.success(`${name} removed from team`);
        fetchMembers();
      } else {
        toast.error("Failed to remove team member");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with Add Member button */}
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-app-card-foreground">Members</h2>
          <p className="text-xs text-muted-foreground">
            {members.length} team member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          size="sm"
          className="h-9 gap-1.5 rounded-full text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Member
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-4xl">
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-primary border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
              <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-app-card-foreground">No team members yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your first member to get started.
              </p>
              <Button
                onClick={() => setFormOpen(true)}
                size="sm"
                className="mt-4 gap-1.5 rounded-full text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3 transition-colors hover:bg-app-bg/80"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-app-muted text-foreground text-xs">
                        {member.name[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-app-card-foreground">
                        {member.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input
                  id="member-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Team member's name"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="member@team.com"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="member-password">Password</Label>
                <Input
                  id="member-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="rounded-xl"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-app-primary hover:bg-app-primary/90"
              >
                {loading ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
