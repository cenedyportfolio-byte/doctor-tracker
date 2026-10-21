"use client";

import Link from "next/link";
import { memo } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { CONDITION_META, CONDITIONS_BY_SEVERITY } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Overview } from "./api";

function share(count: number, total: number) {
  return total ? (count / total) * 100 : 0;
}

/**
 * Patients by condition as a labelled bar list. Each row carries icon + label + value, so the
 * status colors (red/green etc.) never have to be told apart by hue alone.
 */
export const ConditionBreakdown = memo(function ConditionBreakdown({
  data,
  className,
}: {
  data: Overview["patientsByCondition"];
  className?: string;
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const counts = new Map(data.map((row) => [row.condition, row.count]));

  return (
    <ChartCard className={className} title="Patients by condition" description={`${formatNumber(total)} patients in total`}>
      <ul className="space-y-4">
        {CONDITIONS_BY_SEVERITY.map((condition) => {
          const meta = CONDITION_META[condition];
          const count = counts.get(condition) ?? 0;
          const pct = share(count, total);
          return (
            <li key={condition}>
              <Link
                href={`/patients?condition=${condition}`}
                className="group block rounded-lg outline-offset-4"
                aria-label={`${meta.label}: ${formatNumber(count)} patients, ${formatPercent(pct)}. View patients`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground group-hover:text-primary">
                    {meta.label}
                  </span>
                  <span className="text-muted tabular-nums">
                    <span className="font-semibold text-foreground">{formatNumber(count)}</span>
                    <span className="ml-1.5 inline-block w-10 text-right text-xs">{formatPercent(pct)}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: meta.chartColor }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
});
