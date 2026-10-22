import { X } from "lucide-react";

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
}

export function FilterChips({ filters, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface-2 pr-1 pl-2.5 text-xs text-foreground"
        >
          {filter.label}
          <button
            type="button"
            onClick={filter.onRemove}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-subtle hover:bg-surface-3 hover:text-foreground"
            aria-label={`Remove filter: ${filter.label}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="cursor-pointer px-1 text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
