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
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#465E20]" />

        <Input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            h-10
            rounded-full
            border border-[#465E20]/30
            bg-[#F8F3E6]
            pl-10
            pr-4
            text-sm
            text-[#465E20]
            shadow-sm
            placeholder:text-[#7A5426]/70
            transition-all
            focus-visible:border-[#465E20]
            focus-visible:ring-2
            focus-visible:ring-[#C9A24A]
            dark:bg-[#C6C7A5]
            dark:text-[#465E20]
          "
        />
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-2">
        <Select
          value={labelFilter}
          onValueChange={(v) => onLabelFilterChange(v as LabelType | "all")}
        >
          <SelectTrigger
            className="
              h-10
              w-full
              rounded-full
              border border-[#465E20]/30
              bg-[#F8F3E6]
              px-4
              text-sm
              text-[#465E20]
              shadow-sm
              transition-all
              focus:ring-2
              focus:ring-[#C9A24A]
              sm:w-40
              dark:bg-[#C6C7A5]
            "
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-[#465E20]" />
            <SelectValue placeholder="Filter label" />
          </SelectTrigger>

          <SelectContent className="border-[#465E20]/20 bg-[#F8F3E6]">
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
          className="
            h-10
            w-10
            shrink-0
            rounded-full
            border border-[#465E20]/30
            bg-[#F8F3E6]
            text-[#465E20]
            shadow-sm
            transition-all
            hover:bg-[#C6C7A5]
            hover:border-[#465E20]
            dark:bg-[#C6C7A5]
          "
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}