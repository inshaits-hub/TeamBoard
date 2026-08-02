import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Mail,
  Trash2,
  Clock,
  Send,
  XCircle,
  RefreshCw,
  UserCheck,
  Ban,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { orgApi } from "@/lib/api";
import { OfflineNotice } from "./org/OfflineNotice";
import type { InvitationPayload, Member } from "@/lib/orgTypes";

export function MembersPage() {
  const { token, isOnline } = useAuth();
  const { members, invitations, roles, refresh, organization } = useOrg();

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviting, setInviting] = useState(false);

  // Remove / revoke confirmation
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingType, setRemovingType] = useState<"member" | "invitation" | null>(null);
  const [removingLabel, setRemovingLabel] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleId) {
      toast.error("Please fill all fields");
      return;
    }

    setInviting(true);
    try {
      const payload: InvitationPayload = {
        email: inviteEmail.trim().toLowerCase(),
        roleId: inviteRoleId,
      };
      await orgApi.createInvitation(token!, payload, organization.id);
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRoleId("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (id: string, email: string) => {
    setRemovingId(id);
    setRemovingType("invitation");
    setRemovingLabel(email);
  };

  const handleRemoveMember = async (member: Member) => {
    setRemovingId(member.id);
    setRemovingType("member");
    setRemovingLabel(member.name || member.email);
  };

  const confirmRemove = async () => {
    if (!removingId || !removingType) return;
    try {
      if (removingType === "invitation") {
        await orgApi.revokeInvitation(token!, removingId, organization.id);
        toast.success("Invitation revoked");
      } else {
        await orgApi.removeMembership(token!, removingId, organization.id);
        toast.success("Member removed from organization");
      }
      setRemovingId(null);
      setRemovingType(null);
      setRemovingLabel("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingInvitations = invitations.filter((i) => Boolean(i));

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-app-card-foreground">Members</h2>
            <p className="text-xs text-muted-foreground">
              {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
              {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} pending`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => refresh()}
            aria-label="Refresh members"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isOnline && (
            <Button
              onClick={() => setInviteOpen(true)}
              size="sm"
              className="h-9 gap-1.5 rounded-full text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-4xl">
          {!isOnline && <OfflineNotice />}

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="members" className="gap-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5" />
                Active Members ({activeMembers.length})
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-1.5 text-xs">
                <Send className="h-3.5 w-3.5" />
                Invitations ({pendingInvitations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-0">
              {activeMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
                  <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-app-card-foreground">No members yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite your first member to get started.
                  </p>
                  {isOnline && (
                    <Button
                      onClick={() => setInviteOpen(true)}
                      size="sm"
                      className="mt-4 gap-1.5 rounded-full text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Invite Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3 transition-colors hover:bg-app-bg/80"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-app-muted text-foreground text-xs">
                            {(member.name || member.email)?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-app-card-foreground">
                              {member.name || "Unknown"}
                            </p>
                            {member.role && (
                              <Badge
                                variant="secondary"
                                className="rounded-full text-[10px] px-1.5 py-0"
                              >
                                {member.role.name}
                              </Badge>
                            )}
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.title && (
                          <span className="text-[10px] text-muted-foreground">{member.title}</span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                        {isOnline && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member)}
                            aria-label={`Remove ${member.name || member.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invitations" className="mt-0">
              {pendingInvitations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/40 px-6 py-12 text-center">
                  <Send className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-app-card-foreground">No pending invitations</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite people to join your organization.
                  </p>
                  {isOnline && (
                    <Button
                      onClick={() => setInviteOpen(true)}
                      size="sm"
                      className="mt-4 gap-1.5 rounded-full text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Invite Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3 transition-colors hover:bg-app-bg/80"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs">
                            <Send className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-app-card-foreground">
                              {invitation.email}
                            </p>
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] border-amber-300 text-amber-600 px-1.5 py-0"
                            >
                              Pending
                            </Badge>
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            {invitation.role?.name ?? "No role"}
                            <span className="mx-1">·</span>
                            Expires{" "}
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </span>
                        {isOnline && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => handleRevokeInvitation(invitation.id, invitation.email)}
                            aria-label={`Revoke invitation for ${invitation.email}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {organization.name || "your organization"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRoleId} onValueChange={setInviteRoleId} required>
                  <SelectTrigger id="invite-role" className="rounded-xl">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(roles?.roles ?? []).map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                        {role.isSystem ? " (system)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviting}
                className="rounded-xl bg-app-primary hover:bg-app-primary/90"
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove / Revoke confirmation dialog */}
      <Dialog
        open={removingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingId(null);
            setRemovingType(null);
            setRemovingLabel("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {removingType === "invitation" ? "Revoke Invitation" : "Remove Member"}
            </DialogTitle>
            <DialogDescription>
              {removingType === "invitation"
                ? `Are you sure you want to revoke the invitation for ${removingLabel}?`
                : `Are you sure you want to remove ${removingLabel} from the organization?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRemovingId(null);
                setRemovingType(null);
                setRemovingLabel("");
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemove}
              className="rounded-xl"
            >
              {removingType === "invitation" ? "Revoke" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
