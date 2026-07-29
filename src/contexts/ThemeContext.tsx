import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type Theme = "light" | "dark" | "pastel-light" | "pastel-dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: "light" | "dark";
}

const THEME_STORAGE_KEY = "todo-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "dark" || theme === "pastel-dark") return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ["light", "dark", "pastel-light", "pastel-dark"].includes(stored)) {
        return stored as Theme;
      }
    } catch {}
    return "pastel-light";
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const resolved = getResolvedTheme(theme);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "pastel-light") return "pastel-dark";
      if (prev === "pastel-dark") return "pastel-light";
      if (prev === "light") return "dark";
      return "light";
    });
  }, []);

  const resolvedTheme = getResolvedTheme(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

