"use client";

import { useCallback } from "react";
import type { ChartStatus } from "@/components/charts/chart-card";
import { PageHeader } from "@/components/ui/page-header";
import { readEnum, useUrlState } from "@/hooks/use-url-state";
import { STATS_RANGES, type StatsRange } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useOverview } from "./api";
import { PatientsByConditionChart } from "./patients-by-condition-chart";
import { PatientsOverTimeChart } from "./patients-over-time-chart";
import { PatientsPerDoctorChart } from "./patients-per-doctor-chart";
import { StatTiles } from "./stat-tiles";

const RANGE_VALUES = STATS_RANGES.map((r) => r.value);
const DEFAULT_RANGE: StatsRange = "30d";

export function DashboardView() {
  const { searchParams, update } = useUrlState();
  const range = readEnum<StatsRange>(searchParams, "range", RANGE_VALUES, DEFAULT_RANGE);
  const rangeLabel = STATS_RANGES.find((r) => r.value === range)!.description;
  // One request feeds every widget; each chart still renders its own loading/empty/error state.
  const { data, error, isPending, isPlaceholderData, refetch } = useOverview(range);
  const status: ChartStatus = isPending ? "loading" : error && !data ? "error" : "ready";
  const retry = useCallback(() => void refetch(), [refetch]);
  const onRangeChange = useCallback(
    (value: StatsRange) => update({ range: value === DEFAULT_RANGE ? undefined : value }),
    [update],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={data ? `All hospitals · data as of ${formatDate(data.generatedAt, "MMM d, h:mm a")}` : "All hospitals"}
      />

      <StatTiles data={data} loading={isPending} rangeLabel={rangeLabel} />

      <div className="grid gap-4 xl:grid-cols-2">
        <PatientsPerDoctorChart data={data?.topDoctors ?? []} status={status} error={error} onRetry={retry} />
        <PatientsOverTimeChart
          data={data?.admissionsTrend ?? []}
          range={range}
          onRangeChange={onRangeChange}
          rangeLabel={rangeLabel}
          status={status}
          updating={isPlaceholderData}
          error={error}
          onRetry={retry}
        />
      </div>

      <PatientsByConditionChart data={data?.patientsByCondition ?? []} status={status} error={error} onRetry={retry} />
    </div>
  );
}

const noop = () => {};

/** Route-level fallback: the same layout with every widget in its loading state. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading dashboard">
      <PageHeader title="Dashboard" description="All hospitals" />
      <StatTiles data={undefined} loading rangeLabel="last 30 days" />
      <div className="grid gap-4 xl:grid-cols-2">
        <PatientsPerDoctorChart data={[]} status="loading" onRetry={noop} />
        <PatientsOverTimeChart
          data={[]}
          range={DEFAULT_RANGE}
          onRangeChange={noop}
          rangeLabel="last 30 days"
          status="loading"
          updating={false}
          onRetry={noop}
        />
      </div>
      <PatientsByConditionChart data={[]} status="loading" onRetry={noop} />
    </div>
  );
}
