import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { orgApi } from "@/lib/api";
import type {
  AuditLogPage,
  Department,
  Invitation,
  Member,
  OrgContextResponse,
  OrgEntity,
  Project,
  RoleListResponse,
  Team,
} from "@/lib/orgTypes";
import { useAuth } from "./AuthContext";

/**
 * Fallback context used when the backend is not configured (offline/local
 * demo mode) so org-driven pages still render something useful instead of
 * crashing on missing data.
 */
const EMPTY_CONTEXT: OrgContextResponse = {
  organization: {
    id: "",
    name: "",
    slug: "",
    plan: "free",
    owner: "",
    settings: {
      timezone: "UTC",
      weekStartsOn: 1,
      requireApprovalForInvites: false,
      enforceMfa: false,
    },
  },
  organizations: [],
  permissions: {},
  roles: [],
  isOwner: false,
  counts: { departments: 0, projects: 0, teams: 0, members: 0 },
};

export interface OrgContextValue {
  /** Active organization context; never null, falls back to EMPTY_CONTEXT. */
  context: OrgContextResponse;
  organization: OrgEntity;
  /** True when a real /org/context payload was loaded from the server. */
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
  /** Optional active organization override for the x-organization-id header. */
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;

  /** Backend-gated permission check against effectivePermissions. */
  can: (permission: string) => boolean;

  refresh: () => Promise<void>;

  /* Convenience data slots (populated when online). */
  departments: Department[];
  teams: Team[];
  projects: Project[];
  members: Member[];
  invitations: Invitation[];
  roles: RoleListResponse | null;
  audit: AuditLogPage | null;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { token, isOnline } = useAuth();
  const [context, setContext] = useState<OrgContextResponse>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  // Online data caches
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<RoleListResponse | null>(null);
  const [audit, setAudit] = useState<AuditLogPage | null>(null);

  const refresh = useCallback(async () => {
    if (!isOnline || !token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await orgApi.getContext(token, activeOrganizationId ?? undefined);
      setContext(data);
      setActiveOrganizationId((prev) => prev ?? data.organization.id ?? null);
      setError(null);

      // Fire the lightweight collections in parallel; failures degrade to [].
      const [depts, teamsData, projs, mems, invites, roleData, auditData] =
        await Promise.allSettled([
          orgApi.listDepartments(token, data.organization.id),
          orgApi.listTeams(token, data.organization.id),
          orgApi.listProjects(token, data.organization.id),
          orgApi.listMembers(token, data.organization.id),
          orgApi.listInvitations(token, data.organization.id),
          orgApi.listRoles(token, data.organization.id),
          orgApi.listAuditLogs(token, data.organization.id, { limit: 50 }),
        ]);

      if (depts.status === "fulfilled") setDepartments(depts.value.departments);
      else setDepartments([]);
      if (teamsData.status === "fulfilled") setTeams(teamsData.value.teams);
      else setTeams([]);
      if (projs.status === "fulfilled") setProjects(projs.value.projects);
      else setProjects([]);
      if (mems.status === "fulfilled") setMembers(mems.value.members);
      else setMembers([]);
      if (invites.status === "fulfilled") setInvitations(invites.value.invitations);
      else setInvitations([]);
      if (roleData.status === "fulfilled") setRoles(roleData.value);
      else setRoles(null);
      if (auditData.status === "fulfilled") setAudit(auditData.value);
      else setAudit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [isOnline, token, activeOrganizationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const can = useCallback(
    (permission: string) => {
      const orgSet = context.permissions["organization:*"];
      if (!orgSet) return false;
      return orgSet.includes("*") || orgSet.includes(permission);
    },
    [context.permissions]
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      context,
      organization: context.organization,
      isLoaded: Boolean(context.organization.id),
      loading,
      error,
      activeOrganizationId,
      setActiveOrganizationId,
      can,
      refresh,
      departments,
      teams,
      projects,
      members,
      invitations,
      roles,
      audit,
    }),
    [
      context,
      loading,
      error,
      activeOrganizationId,
      can,
      refresh,
      departments,
      teams,
      projects,
      members,
      invitations,
      roles,
      audit,
    ]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return ctx;
}

