"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable, type ChartStatus } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { formatNumber } from "@/lib/utils";
import type { Overview } from "./api";

type Row = Overview["topDoctors"][number];
const ROW_HEIGHT = 30;

function shortName(name: string) {
  return name.length > 20 ? `${name.slice(0, 19)}…` : name;
}

interface Props {
  data: Overview["topDoctors"];
  status: ChartStatus;
  error?: unknown;
  onRetry: () => void;
}

export const PatientsPerDoctorChart = memo(function PatientsPerDoctorChart({ data, status, error, onRetry }: Props) {
  const router = useRouter();
  const height = Math.max(data.length, 10) * ROW_HEIGHT;

  return (
    <ChartCard
      title="Patients per doctor"
      description="Top 10 doctors by number of patients"
      status={status === "ready" && data.length === 0 ? "empty" : status}
      error={error}
      onRetry={onRetry}
      emptyMessage="No patients are assigned to doctors yet."
      height={height}
      table={
        <DataTable caption="Patients per doctor" columns={["Doctor", "Patients"]} rows={data.map((d) => [d.name, d.patients])} />
      }
    >
      <BarChart
        responsive
        layout="vertical"
        style={{ width: "100%", height }}
        data={data}
        margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
        barCategoryGap={6}
        accessibilityLayer
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTick, fill: "var(--muted)", fontSize: 12 }}
          tickFormatter={shortName}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as Row | undefined;
            if (!active || !row) return null;
            return (
              <ChartTooltipCard
                title={row.name}
                rows={[{ label: "Patients", value: row.patients }]}
                footer={`${row.specialization} · ${row.hospital}`}
              />
            );
          }}
        />
        <Bar
          dataKey="patients"
          name="Patients"
          fill="var(--chart-1)"
          barSize={14}
          radius={[0, 2, 2, 0]}
          cursor="pointer"
          isAnimationActive={false}
          onClick={(entry) => {
            const row = (entry as { payload?: Row }).payload;
            if (row) router.push(`/doctors/${row.id}`);
          }}
        >
          <LabelList
            dataKey="patients"
            position="right"
            offset={6}
            formatter={(value) => formatNumber(Number(value))}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ChartCard>
  );
});
