"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";
import { PAGE_SIZES } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";
import type { PageMeta } from "@/types/api";
import { Button } from "./button";

/** Page numbers with ellipses: 1 … 4 5 6 … 20 */
function pageItems(page: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  noun?: string;
  className?: string;
}

export const Pagination = memo(function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  noun = "results",
  className,
}: PaginationProps) {
  const { page, limit, total, totalPages, hasPrevPage, hasNextPage } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-5",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-[13px] text-muted">
        <p aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">
            {formatNumber(from)}–{formatNumber(to)}
          </span>{" "}
          of <span className="font-semibold text-foreground tabular-nums">{formatNumber(total)}</span> {noun}
        </p>
        <label className="hidden items-center gap-2 sm:flex">
          <span className="sr-only">Rows per page</span>
          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 cursor-pointer rounded-md border border-border-strong bg-surface px-2 text-[13px] text-foreground"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <ol className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <li key={`gap-${i}`} className="w-6 text-center text-sm text-subtle" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  className={cn(
                    "h-8 min-w-8 cursor-pointer rounded-md px-2 text-[13px] tabular-nums transition-colors",
                    item === page
                      ? "border border-border-strong bg-surface font-semibold text-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ol>
        <span className="px-2 text-[13px] font-medium text-muted tabular-nums sm:hidden">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
});
