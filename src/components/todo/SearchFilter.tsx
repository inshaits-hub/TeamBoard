import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabelType } from "./types";
import { LABELS } from "./types";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  labelFilter: LabelType | "all";
  onLabelFilterChange: (value: LabelType | "all") => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  labelFilter,
  onLabelFilterChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-full border-border/50 bg-app-card pl-10 pr-4 text-sm shadow-sm focus-visible:ring-app-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={labelFilter}
          onValueChange={(v) => onLabelFilterChange(v as LabelType | "all")}
        >
          <SelectTrigger className="h-10 w-full rounded-full border-border/50 bg-app-card px-4 text-sm shadow-sm sm:w-40">
            <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Filter label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All labels</SelectItem>
            {Object.entries(LABELS).map(([key, l]) => (
              <SelectItem key={key} value={key}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full border-border/50 bg-app-card"
        >
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
