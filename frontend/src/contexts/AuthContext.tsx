import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authApi } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "todo-auth-token";

function toUser(apiUser: { id: string; name: string; email: string }): User {
  const initial = apiUser.name?.[0]?.toUpperCase() || "?";
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    avatar: initial,
    initials: initial,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount by validating the saved token with the backend
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe(token)
      .then((apiUser) => setUser(toUser(apiUser)))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const data = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(toUser(data.user));
    return true;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(toUser(data.user));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        signup,
        logout,
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