import React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/contexts/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  // Icons use currentColor so they inherit the active theme's --app-primary
  // via the text-app-primary class below, instead of a hardcoded hex.
  const themes: { key: Theme; label: string; icon: React.ReactNode }[] = [
    {
      key: "pastel-light",
      label: "Pastel Light",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      key: "light",
      label: "Light",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      key: "dark",
      label: "Dark",
      icon: <Moon className="h-4 w-4" />,
    },
  ];

  const currentIcon =
    themes.find((t) => t.key === theme)?.icon ?? themes[0].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="
            h-9
            w-9
            rounded-full
            border
            border-app-primary/30
            bg-app-card
            text-app-primary
            shadow-sm
            transition-all
            hover:bg-app-muted
            hover:border-app-primary
            hover:scale-105
            focus-visible:ring-2
            focus-visible:ring-app-primary/50
          "
        >
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          min-w-44
          rounded-2xl
          border
          border-app-primary/20
          bg-app-card
          p-2
          shadow-xl
        "
      >
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.key}
            onClick={() => setTheme(t.key)}
            className={`
              cursor-pointer
              rounded-xl
              px-3
              py-2
              text-sm
              transition-all
              ${
                theme === t.key
                  ? "bg-app-primary text-app-primary-foreground font-semibold"
                  : "text-app-card-foreground hover:bg-app-muted"
              }
            `}
          >
            <span className="mr-3">{t.icon}</span>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

