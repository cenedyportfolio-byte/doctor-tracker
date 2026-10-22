import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

interface ListToolbarProps<S extends string> {
  searchKey: number;
  search?: string;
  onSearch: (search: string) => void;
  searchPlaceholder: string;
  searchLabel: string;
  filterCount: number;
  onOpenFilters: () => void;
  sort: S;
  sortOptions: ReadonlyArray<{ value: S; label: string }>;
  onSortChange: (sort: S) => void;
  sortLabel: string;
  action?: ReactNode;
}

export function ListToolbar<S extends string>({
  searchKey,
  search,
  onSearch,
  searchPlaceholder,
  searchLabel,
  filterCount,
  onOpenFilters,
  sort,
  sortOptions,
  onSortChange,
  sortLabel,
  action,
}: ListToolbarProps<S>) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 sm:px-4">
      <SearchInput
        key={searchKey}
        defaultValue={search}
        onSearch={onSearch}
        placeholder={searchPlaceholder}
        label={searchLabel}
        className="min-w-0 basis-full lg:flex-[1_1_16rem]"
      />
      <Button variant="secondary" onClick={onOpenFilters}>
        <SlidersHorizontal className="size-4" />
        Filters{filterCount > 0 && <span className="text-muted">({filterCount})</span>}
      </Button>
      <Select
        aria-label={sortLabel}
        value={sort}
        onChange={(e) => onSortChange(e.target.value as S)}
        className="min-w-28 flex-1 sm:w-40 sm:flex-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {action}
    </div>
  );
}
