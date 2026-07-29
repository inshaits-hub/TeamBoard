import { forwardRef } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  resultCount: number;
}

export const SearchFilter = forwardRef<HTMLInputElement, SearchFilterProps>(
  function SearchFilter(
    { search, onSearchChange, labelFilter, onLabelFilterChange, resultCount },
    ref
  ) {
    return (
      <div role="search" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <Input
            id="task-search"
            ref={ref}
            type="search"
            placeholder="Search tasks... (press /)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-describedby="task-search-results"
            className="h-11 rounded-full border-border/50 bg-app-card pl-10 pr-4 text-sm shadow-sm focus-visible:ring-app-primary"
          />
          <span id="task-search-results" className="sr-only" aria-live="polite">
            {resultCount} {resultCount === 1 ? "task" : "tasks"} match the current
            filters.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="label-filter" className="sr-only">
            Filter by label
          </label>
          <Select
            value={labelFilter}
            onValueChange={(v) => onLabelFilterChange(v as LabelType | "all")}
          >
            <SelectTrigger
              id="label-filter"
              aria-label="Filter by label"
              className="h-11 w-full rounded-full border-border/50 bg-app-card px-4 text-sm shadow-sm sm:w-44"
            >
              <SlidersHorizontal
                className="mr-2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
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
        </div>
      </div>
    );
  }
);
