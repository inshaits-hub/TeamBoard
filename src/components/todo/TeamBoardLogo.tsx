import { LayoutGrid } from "lucide-react";

interface TeamBoardLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function TeamBoardLogo({ size = "md", showText = false }: TeamBoardLogoProps) {
  const sizeMap = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-sm" },
    md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-base" },
    lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-2xl" },
  };

  const s = sizeMap[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid ${s.box} place-items-center rounded-xl bg-gradient-to-br from-app-primary to-indigo-500 shadow-lg shadow-app-primary/25`}
      >
        <LayoutGrid className={`${s.icon} text-white`} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold text-app-card-foreground`}>
          TeamBoard
        </span>
      )}
    </div>
  );
}
