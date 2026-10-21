import type { ReactNode } from "react";
import { formatNumber } from "@/lib/utils";

export interface TooltipRow {
  label: string;
  value: number | string;
  color?: string;
}

/** Shared tooltip body: mark swatches carry identity, text stays in text colors. */
export function ChartTooltipCard({ title, rows, footer }: { title: ReactNode; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-40 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-overlay">
      <p className="mb-1.5 font-semibold text-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-muted">
              {row.color && <span className="size-2 rounded-[2px]" style={{ background: row.color }} aria-hidden="true" />}
              {row.label}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {typeof row.value === "number" ? formatNumber(row.value) : row.value}
            </span>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-1.5 border-t border-border pt-1.5 text-muted">{footer}</p>}
    </div>
  );
}

export const axisTick = { fill: "var(--subtle)", fontSize: 11, fontWeight: 500 } as const;
