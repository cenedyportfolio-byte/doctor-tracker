"use client";

import { memo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable, LegendItem } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { formatCompact, formatDate } from "@/lib/utils";
import type { Overview } from "./api";

const AXIS_FORMAT = "MMM d";
const TOOLTIP_FORMAT = "EEEE, MMM d";

// UTC day buckets from the API → label in UTC so a day never shifts into its neighbour.
function bucketLabel(bucket: string, pattern: string) {
  const date = new Date(bucket);
  return formatDate(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), pattern);
}

interface AdmissionsChartProps {
  data: Overview["admissionsTrend"];
  rangeLabel: string;
  className?: string;
}

export const AdmissionsChart = memo(function AdmissionsChart({
  data,
  rangeLabel,
  className,
}: AdmissionsChartProps) {
  return (
    <ChartCard
      className={className}
      title="Admissions"
      description={`Patients admitted per day, ${rangeLabel}`}
      legend={
        <div className="flex flex-wrap gap-4">
          <LegendItem color="var(--chart-1)" label="All admissions" />
          <LegendItem color="var(--status-critical)" label="Critical on admission" line />
        </div>
      }
      table={
        <DataTable
          caption="Admissions over time"
          columns={["Period", "Admissions", "Critical"]}
          rows={data.map((d) => [bucketLabel(d.bucket, TOOLTIP_FORMAT), d.admissions, d.critical])}
        />
      }
    >
      <ComposedChart
        responsive
        style={{ width: "100%", height: 280 }}
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="admissions-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="bucket"
          tickFormatter={(value: string) => bucketLabel(value, AXIS_FORMAT)}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--chart-grid)" }}
          minTickGap={24}
          tickMargin={8}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value: number) => formatCompact(value)}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as Overview["admissionsTrend"][number] | undefined;
            if (!active || !row) return null;
            return (
              <ChartTooltipCard
                title={bucketLabel(row.bucket, TOOLTIP_FORMAT)}
                rows={[
                  { label: "Admissions", value: row.admissions, color: "var(--chart-1)" },
                  { label: "Critical", value: row.critical, color: "var(--status-critical)" },
                ]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="admissions"
          name="Admissions"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#admissions-fill)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--chart-1)" }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="critical"
          name="Critical"
          stroke="var(--status-critical)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--status-critical)" }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartCard>
  );
});
