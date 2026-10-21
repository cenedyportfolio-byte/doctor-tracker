import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
