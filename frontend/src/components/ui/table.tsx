import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-y border-border bg-surface-2", className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 px-4 text-xs font-semibold tracking-wide whitespace-nowrap text-muted first:pl-5 last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

interface SortableThProps {
  children: ReactNode;
  /** Current direction for this column, or null when the list is sorted by another column. */
  direction: "asc" | "desc" | null;
  onSort: () => void;
  className?: string;
}

export function SortableTh({ children, direction, onSort, className }: SortableThProps) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Th
      className={className}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 hover:bg-surface-3 hover:text-foreground",
          direction && "text-foreground",
        )}
      >
        {children}
        <Icon className={cn("size-3.5", !direction && "opacity-50")} aria-hidden="true" />
      </button>
    </Th>
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-border transition-colors last:border-b-0 hover:bg-surface-2", className)}
      {...props}
    />
  );
}

/** Placeholder rows shown while a list loads; mirrors the table's row height. */
export function TableSkeleton({ rows = 8, label }: { rows?: number; label: string }) {
  return (
    <div className="divide-y divide-border border-t border-border" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-3.5 sm:px-5">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="hidden h-3.5 w-32 md:block" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      ))}
    </div>
  );
}
