import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

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

const SAMPLE_USERS: User[] = [
  { id: "u1", name: "Alice", email: "alice@team.com", avatar: "A", initials: "A" },
  { id: "u2", name: "Bob", email: "bob@team.com", avatar: "B", initials: "B" },
  { id: "u3", name: "Charlie", email: "charlie@team.com", avatar: "C", initials: "C" },
  { id: "u4", name: "Diana", email: "diana@team.com", avatar: "D", initials: "D" },
];

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = "todo-auth-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 600));

    const found = SAMPLE_USERS.find((u) => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      return true;
    }

    // Auto-register if email matches any pattern
    if (email.includes("@") && email.includes(".")) {
      const name = email.split("@")[0];
      const newUser: User = {
        id: `u${Date.now()}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email,
        avatar: name[0].toUpperCase(),
        initials: name[0].toUpperCase(),
      };
      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      return true;
    }

    return false;
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600));

    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      avatar: name[0].toUpperCase(),
      initials: name[0].toUpperCase(),
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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

