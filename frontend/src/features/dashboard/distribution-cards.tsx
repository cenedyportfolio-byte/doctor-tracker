"use client";

import Link from "next/link";
import { memo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable, LegendItem } from "@/components/charts/chart-card";
import { axisTick, ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CONDITION_ICONS } from "@/features/patients/condition-badge";
import { CONDITION_META, CONDITIONS_BY_SEVERITY, GENDER_LABEL } from "@/lib/constants";
import { formatNumber, formatPercent, pluralize } from "@/lib/utils";
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
          const Icon = CONDITION_ICONS[condition];
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
                    <Icon className="size-4 text-subtle" aria-hidden="true" />
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

/** Patients per specialization (bar) with the doctor count as text: two measures, never two axes. */
export const SpecializationBreakdown = memo(function SpecializationBreakdown({
  data,
}: {
  data: Overview["specializations"];
}) {
  const max = Math.max(...data.map((row) => row.patients), 1);

  return (
    <ChartCard
      title="Specializations"
      description="Patient load and doctor headcount per specialization"
      table={
        <DataTable
          caption="Patients and doctors by specialization"
          columns={["Specialization", "Doctors", "Patients"]}
          rows={data.map((d) => [d.specialization, d.doctors, d.patients])}
        />
      }
    >
      <ul className="space-y-3">
        {data.map((row) => (
          <li key={row.specialization} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
            <Link
              href={`/doctors?specialization=${encodeURIComponent(row.specialization)}`}
              className="truncate font-medium text-foreground hover:text-primary"
            >
              {row.specialization}
            </Link>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${(row.patients / max) * 100}%` }} />
            </div>
            <span className="w-28 text-right text-xs text-muted tabular-nums">
              <span className="text-sm font-semibold text-foreground">{formatNumber(row.patients)}</span> ·{" "}
              {pluralize(row.doctors, "doctor")}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
});

const GENDER_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"] as const;

/** Age groups (columns) and gender split (100% bar) side by side. */
export const Demographics = memo(function Demographics({
  ageGroups,
  genders,
  className,
}: {
  ageGroups: Overview["ageGroups"];
  genders: Overview["patientsByGender"];
  className?: string;
}) {
  const total = genders.reduce((sum, row) => sum + row.count, 0);

  return (
    <ChartCard
      className={className}
      title="Demographics"
      description="All patients by age group and gender"
      table={
        <DataTable
          caption="Patients by age group and gender"
          columns={["Group", "Patients"]}
          rows={[
            ...ageGroups.map((d) => [`Age ${d.label}`, d.count] as [string, number]),
            ...genders.map((d) => [GENDER_LABEL[d.gender], d.count] as [string, number]),
          ]}
        />
      }
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-label="Age distribution">
          <h3 className="mb-1 text-xs font-semibold text-muted">Age</h3>
          <BarChart
            responsive
            style={{ width: "100%", height: 230 }}
            data={ageGroups}
            margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} tickMargin={8} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--surface-3)", radius: 6 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Overview["ageGroups"][number] | undefined;
                if (!active || !row) return null;
                return (
                  <ChartTooltipCard
                    title={`Age ${row.label}`}
                    rows={[{ label: "Patients", value: row.count, color: "var(--chart-1)" }]}
                    footer={`${formatPercent(share(row.count, total), 1)} of all patients`}
                  />
                );
              }}
            />
            <Bar dataKey="count" name="Patients" fill="var(--chart-1)" barSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList
                dataKey="count"
                position="top"
                offset={6}
                formatter={(value) => formatNumber(Number(value))}
                style={{ fill: "var(--muted)", fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </section>

        <section aria-label="Gender split" className="md:border-l md:border-border md:pl-8">
          <h3 className="mb-4 text-xs font-semibold text-muted">Gender</h3>
          <div
            className="flex h-4 gap-0.5 overflow-hidden rounded-md"
            role="img"
            aria-label={genders.map((d) => `${GENDER_LABEL[d.gender]} ${formatPercent(share(d.count, total))}`).join(", ")}
          >
            {genders.map((row, i) =>
              row.count > 0 ? (
                <div
                  key={row.gender}
                  className="h-full first:rounded-l-md last:rounded-r-md"
                  style={{ width: `${share(row.count, total)}%`, background: GENDER_COLORS[i] }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-5 space-y-3.5">
            {genders.map((row, i) => (
              <li key={row.gender} className="flex items-center justify-between text-sm">
                <LegendItem color={GENDER_COLORS[i]!} label={GENDER_LABEL[row.gender]} />
                <span className="text-muted tabular-nums">
                  <span className="font-semibold text-foreground">{formatNumber(row.count)}</span>
                  <span className="ml-2 inline-block w-12 text-right text-xs">{formatPercent(share(row.count, total), 1)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ChartCard>
  );
});
