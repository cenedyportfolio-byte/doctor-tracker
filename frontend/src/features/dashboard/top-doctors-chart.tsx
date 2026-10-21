"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { formatNumber } from "@/lib/utils";
import type { Overview } from "./api";

type Row = Overview["topDoctors"][number];

function shortName(name: string) {
  return name.length > 20 ? `${name.slice(0, 19)}…` : name;
}

export const TopDoctorsChart = memo(function TopDoctorsChart({ data }: { data: Overview["topDoctors"] }) {
  const router = useRouter();
  const height = Math.max(data.length * 34 + 16, 120);

  return (
    <ChartCard
      title="Patients per doctor"
      description="Top 10 doctors by current patient load · click a bar to open the profile"
      table={
        <DataTable
          caption="Patients per doctor"
          columns={["Doctor", "Patients", "Critical"]}
          rows={data.map((d) => [d.name, d.patients, d.critical])}
        />
      }
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No patients assigned yet.</p>
      ) : (
        <BarChart
          responsive
          layout="vertical"
          style={{ width: "100%", height }}
          data={data}
          margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
          barCategoryGap={8}
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tickLine={false}
            axisLine={false}
            tick={{ ...axisTick, fill: "var(--muted)", fontSize: 12 }}
            tickFormatter={shortName}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-3)", radius: 6 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipCard
                  title={row.name}
                  rows={[
                    { label: "Patients", value: row.patients, color: "var(--chart-1)" },
                    { label: "Critical", value: row.critical },
                  ]}
                  footer={`${row.specialization} · ${row.hospital}`}
                />
              );
            }}
          />
          <Bar
            dataKey="patients"
            name="Patients"
            fill="var(--chart-1)"
            barSize={16}
            radius={[0, 4, 4, 0]}
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
              offset={8}
              formatter={(value) => formatNumber(Number(value))}
              style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      )}
    </ChartCard>
  );
});
