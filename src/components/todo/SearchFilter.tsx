import { forwardRef } from "react";
import { ArrowUpDown, CalendarDays, Search, SlidersHorizontal } from "lucide-react";
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
import { DUE_FILTERS, SORT_MODES, type DueFilter, type SortMode } from "./dueDate";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  labelFilter: LabelType | "all";
  onLabelFilterChange: (value: LabelType | "all") => void;
  dueFilter: DueFilter;
  onDueFilterChange: (value: DueFilter) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  resultCount: number;
}

const triggerClass =
  "h-11 w-full rounded-full border-border/50 bg-app-card px-4 text-sm shadow-sm transition-colors hover:bg-app-muted/60 sm:w-44";

export const SearchFilter = forwardRef<HTMLInputElement, SearchFilterProps>(
  function SearchFilter(
    {
      search,
      onSearchChange,
      labelFilter,
      onLabelFilterChange,
      dueFilter,
      onDueFilterChange,
      sortMode,
      onSortModeChange,
      resultCount,
    },
    ref
  ) {
    return (
      <div
        role="search"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4"
      >
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
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
                className={triggerClass}
              >
                <SlidersHorizontal
                  className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
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

          <div>
            <label htmlFor="due-filter" className="sr-only">
              Filter by due date
            </label>
            <Select
              value={dueFilter}
              onValueChange={(v) => onDueFilterChange(v as DueFilter)}
            >
              <SelectTrigger
                id="due-filter"
                aria-label="Filter by due date"
                className={triggerClass}
              >
                <CalendarDays
                  className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Due date" />
              </SelectTrigger>
              <SelectContent>
                {DUE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="sort-mode" className="sr-only">
              Sort tasks
            </label>
            <Select
              value={sortMode}
              onValueChange={(v) => onSortModeChange(v as SortMode)}
            >
              <SelectTrigger
                id="sort-mode"
                aria-label="Sort tasks"
                className={triggerClass}
              >
                <ArrowUpDown
                  className="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_MODES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }
);
