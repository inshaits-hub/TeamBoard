import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  normalizeRole,
  type Permission,
  type Role,
} from "@/lib/permissions";

export interface UsePermissionResult {
  /** Normalized front-end role ("admin" | "team_leader" | "member"). */
  role: Role;
  /** Returns true when the current user holds the given permission. */
  can: (permission: Permission) => boolean;
}

/**
 * Reads the current user's role from the auth context and exposes a typed
 * `can(permission)` predicate for UI gating (sidebar items, buttons, routes).
 */
export function usePermission(): UsePermissionResult {
  const { user } = useAuth();

  return useMemo(() => {
    const role = normalizeRole(user?.role);
    return {
      role,
      can: (permission: Permission) => hasPermission(role, permission),
    };
  }, [user?.role]);
}

