"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  legend?: ReactNode;
  /** Accessible table view of the same data, toggled from the header. */
  table?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, description, action, legend, table, className, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        title={title}
        description={description}
        action={
          (action || table) && (
            <div className="flex items-center gap-2">
              {action}
              {table && (
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  aria-pressed={showTable}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-subtle ring-1 ring-border transition-colors hover:bg-surface-3 hover:text-foreground"
                  aria-label={showTable ? "Show chart" : "Show data table"}
                  title={showTable ? "Show chart" : "Show data table"}
                >
                  {showTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
                </button>
              )}
            </div>
          )
        }
      />
      {legend && <div className="px-5 pt-2">{legend}</div>}
      <div className="flex-1 px-5 pt-3 pb-5">{showTable && table ? table : children}</div>
    </Card>
  );
}

export function LegendItem({ color, label, line = false }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span
        className={cn("shrink-0", line ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-[3px]")}
        style={{ background: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl ring-1 ring-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={cn("px-3 py-2 text-xs font-semibold text-muted", i > 0 && "text-right")}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-border">
              {row.map((cell, i) => (
                <td key={i} className={cn("px-3 py-1.5", i > 0 && "text-right tabular-nums")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
