import { memo } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable, LegendItem, type ChartStatus } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { STATS_RANGES, type StatsRange } from "@/lib/constants";
import { cn, formatCompact, formatDate } from "@/lib/utils";
import type { Overview } from "./api";

const HEIGHT = 260;

// UTC day buckets from the API → label in UTC so a day never shifts into its neighbour.
function dayLabel(bucket: string, pattern: string) {
  const date = new Date(bucket);
  return formatDate(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), pattern);
}

interface Props {
  data: Overview["admissionsTrend"];
  range: StatsRange;
  onRangeChange: (range: StatsRange) => void;
  rangeLabel: string;
  status: ChartStatus;
  /** True while the newly selected range loads (the previous one stays visible, dimmed). */
  updating: boolean;
  error?: unknown;
  onRetry: () => void;
}

export const PatientsOverTimeChart = memo(function PatientsOverTimeChart({
  data,
  range,
  onRangeChange,
  rangeLabel,
  status,
  updating,
  error,
  onRetry,
}: Props) {
  const empty = status === "ready" && data.every((d) => d.admissions === 0);

  return (
    <ChartCard
      title="Patients over time"
      description={`Admissions per day, ${rangeLabel}`}
      status={empty ? "empty" : status}
      error={error}
      onRetry={onRetry}
      emptyMessage={`No admissions in the ${rangeLabel}.`}
      height={HEIGHT}
      action={
        <SegmentedControl
          label="Time range"
          value={range}
          onChange={onRangeChange}
          options={STATS_RANGES.map((r) => ({ value: r.value, label: r.label, title: `Show the ${r.description}` }))}
        />
      }
      legend={
        <div className="flex flex-wrap gap-4">
          <LegendItem color="var(--chart-1)" label="Admissions" line />
          <LegendItem color="var(--status-critical)" label="Critical on admission" line />
        </div>
      }
      table={
        <DataTable
          caption="Admissions per day"
          columns={["Day", "Admissions", "Critical"]}
          rows={data.map((d) => [dayLabel(d.bucket, "EEE, MMM d"), d.admissions, d.critical])}
        />
      }
    >
      <div className={cn("transition-opacity", updating && "opacity-50")}>
        <LineChart
          responsive
          style={{ width: "100%", height: HEIGHT }}
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="bucket"
            tickFormatter={(value: string) => dayLabel(value, "MMM d")}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-axis)" }}
            minTickGap={28}
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
                  title={dayLabel(row.bucket, "EEEE, MMM d")}
                  rows={[
                    { label: "Admissions", value: row.admissions, color: "var(--chart-1)" },
                    { label: "Critical", value: row.critical, color: "var(--status-critical)" },
                  ]}
                />
              );
            }}
          />
          <Line
            type="linear"
            dataKey="admissions"
            name="Admissions"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="critical"
            name="Critical"
            stroke="var(--status-critical)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 2, stroke: "var(--surface)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </ChartCard>
  );
});
