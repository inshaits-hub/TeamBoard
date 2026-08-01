import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { authApi, isBackendConfigured, tokenStore, type ApiUser } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  avatar: string;
  initials: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when a real backend is wired up; false means local demo mode. */
  isOnline: boolean;
}

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, organization: string) => Promise<boolean>;
  logout: () => void;
  createMember: (name: string, email: string, password: string) => Promise<boolean>;
  listMembers: () => Promise<TeamMember[]>;
  deleteMember: (id: string) => Promise<boolean>;
  getOrgInfo: () => Promise<{ organization: string; memberCount: number; role: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_USER_KEY = "todo-auth-user";

function toUser(apiUser: ApiUser): User {
  const initial = apiUser.name?.[0]?.toUpperCase() || "?";
  return {
    ...apiUser,
    avatar: initial,
    initials: initial,
    role: apiUser.role ?? "admin",
    organization: apiUser.organization ?? "",
  };
}

/** Offline fallback so the app still works without a deployed API. */
function localUser(name: string, email: string, organization?: string): User {
  const initial = name[0]?.toUpperCase() || "?";
  return {
    id: `local-${email}`,
    name,
    email,
    role: "admin",
    organization: organization ?? "My Team",
    avatar: initial,
    initials: initial,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session: validate the saved token, or fall back to local mode.
  useEffect(() => {
    const saved = tokenStore.get();

    if (isBackendConfigured && saved) {
      authApi
        .getMe(saved)
        .then((apiUser) => {
          setUser(toUser(apiUser));
          setToken(saved);
        })
        .catch(() => tokenStore.clear())
        .finally(() => setIsLoading(false));
      return;
    }

    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) setUser(JSON.parse(stored) as User);
    } catch {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (isBackendConfigured) {
      const data = await authApi.login(email, password);
      tokenStore.set(data.token);
      setToken(data.token);
      setUser(toUser(data.user));
      return true;
    }

    if (!email.includes("@")) return false;
    const next = localUser(email.split("@")[0], email);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(next));
    setUser(next);
    return true;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, organization: string) => {
      if (isBackendConfigured) {
        const data = await authApi.register(name, email, password, organization);
        tokenStore.set(data.token);
        setToken(data.token);
        setUser(toUser(data.user));
        return true;
      }

      const next = localUser(name, email, organization);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(next));
      setUser(next);
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    tokenStore.clear();
    localStorage.removeItem(LOCAL_USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const apiUser = await authApi.getMe(token);
      setUser(toUser(apiUser));
    } catch {
      // ignore
    }
  }, [token]);

  const createMember = useCallback(
    async (name: string, email: string, password: string) => {
      if (!token) return false;
      try {
        await authApi.createMember(token, name, email, password);
        return true;
      } catch {
        return false;
      }
    },
    [token]
  );

  const listMembers = useCallback(async () => {
    if (!token) return [];
    try {
      const data = await authApi.listMembers(token);
      return data.members ?? [];
    } catch {
      return [];
    }
  }, [token]);

  const deleteMember = useCallback(
    async (id: string) => {
      if (!token) return false;
      try {
        await authApi.deleteMember(token, id);
        return true;
      } catch {
        return false;
      }
    },
    [token]
  );

  const getOrgInfo = useCallback(async () => {
    if (!token)
      return { organization: user?.organization ?? "", memberCount: 0, role: user?.role ?? "admin" };
    try {
      return await authApi.getOrgInfo(token);
    } catch {
      return { organization: user?.organization ?? "", memberCount: 0, role: user?.role ?? "admin" };
    }
  }, [token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null,
        isLoading,
        isOnline: isBackendConfigured,
        login,
        signup,
        logout,
        createMember,
        listMembers,
        deleteMember,
        getOrgInfo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
