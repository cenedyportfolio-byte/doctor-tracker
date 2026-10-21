"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useCurrentUser } from "@/features/auth/api";
import { readEnum, useUrlState } from "@/hooks/use-url-state";
import { STATS_RANGES, type StatsRange } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AdmissionsChart } from "./admissions-chart";
import { useOverview } from "./api";
import { ConditionBreakdown } from "./condition-breakdown";
import { KpiCards, KpiCardsSkeleton } from "./kpi-cards";
import { TopDoctorsChart } from "./top-doctors-chart";

const RANGE_VALUES = STATS_RANGES.map((r) => r.value);

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { searchParams, update } = useUrlState();
  const range = readEnum<StatsRange>(searchParams, "range", RANGE_VALUES, "30d");
  const rangeLabel = STATS_RANGES.find((r) => r.value === range)!.description;
  const { data, error, isPending, isPlaceholderData, refetch } = useOverview(range);
  const user = useCurrentUser();

  // Rendered only once the session has loaded in the browser, so the time-based greeting
  // never differs between server and client markup.
  const now = user ? new Date() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user && now ? `${greeting(now.getHours())}, ${user.name.split(" ")[0]}` : "Dashboard"}
        description={
          now ? `Here's how your hospitals are doing · ${format(now, "EEEE, MMMM d")}` : "Overview of doctors and patients"
        }
        actions={
          <SegmentedControl
            label="Time range"
            value={range}
            onChange={(value) => update({ range: value === "30d" ? undefined : value })}
            options={STATS_RANGES.map((r) => ({ value: r.value, label: r.label, title: `Show the ${r.description}` }))}
          />
        }
      />

      {isPending ? (
        <DashboardSkeleton />
      ) : error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      ) : data ? (
        <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
          <KpiCards data={data} rangeLabel={rangeLabel} />

          <AdmissionsChart data={data.admissionsTrend} rangeLabel={rangeLabel} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TopDoctorsChart data={data.topDoctors} />
            <ConditionBreakdown data={data.patientsByCondition} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <KpiCardsSkeleton />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-56" />
          <Skeleton className="mt-6 h-[260px] w-full rounded-xl" />
        </Card>
        <Card className="space-y-5 p-5">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-80 p-5">
          <Skeleton className="h-full w-full rounded-xl" />
        </Card>
        <Card className="h-80 p-5">
          <Skeleton className="h-full w-full rounded-xl" />
        </Card>
      </div>
    </div>
  );
}
