import { useRouter } from "next/navigation";
import { memo } from "react";
import { Bar, BarChart, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable, type ChartStatus } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CONDITION_META, CONDITIONS_BY_SEVERITY, type Condition } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Overview } from "./api";

const HEIGHT = CONDITIONS_BY_SEVERITY.length * 34;

interface Props {
  data: Overview["patientsByCondition"];
  status: ChartStatus;
  error?: unknown;
  onRetry: () => void;
}

/** Bars use the same status colours as the condition dots in the tables, next to text labels. */
export const PatientsByConditionChart = memo(function PatientsByConditionChart({ data, status, error, onRetry }: Props) {
  const router = useRouter();
  const counts = new Map(data.map((row) => [row.condition, row.count]));
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const rows = CONDITIONS_BY_SEVERITY.map((condition) => ({
    condition,
    label: CONDITION_META[condition].label,
    count: counts.get(condition) ?? 0,
  }));

  return (
    <ChartCard
      title="Patients by condition"
      description={`All ${formatNumber(total)} patients · click a bar to see them`}
      status={status === "ready" && total === 0 ? "empty" : status}
      error={error}
      onRetry={onRetry}
      emptyMessage="No patients yet."
      height={HEIGHT}
      table={
        <DataTable
          caption="Patients by condition"
          columns={["Condition", "Patients", "Share"]}
          rows={rows.map((r) => [r.label, r.count, formatPercent(total ? (r.count / total) * 100 : 0)])}
        />
      }
    >
      <BarChart
        responsive
        layout="vertical"
        style={{ width: "100%", height: HEIGHT }}
        data={rows}
        margin={{ top: 0, right: 64, bottom: 0, left: 0 }}
        barCategoryGap={8}
        accessibilityLayer
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTick, fill: "var(--muted)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
            if (!active || !row) return null;
            return (
              <ChartTooltipCard
                title={row.label}
                rows={[
                  { label: "Patients", value: row.count },
                  { label: "Share", value: formatPercent(total ? (row.count / total) * 100 : 0, 1) },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="count"
          name="Patients"
          barSize={16}
          radius={[0, 2, 2, 0]}
          cursor="pointer"
          isAnimationActive={false}
          onClick={(entry) => {
            const row = (entry as { payload?: { condition: Condition } }).payload;
            if (row) router.push(`/patients?condition=${row.condition}`);
          }}
        >
          {rows.map((row) => (
            <Cell key={row.condition} fill={CONDITION_META[row.condition].chartColor} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            offset={6}
            formatter={(value) => {
              const count = Number(value);
              return `${formatNumber(count)} (${formatPercent(total ? (count / total) * 100 : 0)})`;
            }}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ChartCard>
  );
});
