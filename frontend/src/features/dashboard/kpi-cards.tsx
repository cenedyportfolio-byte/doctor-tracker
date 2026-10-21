"use client";

import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact, formatPercent } from "@/lib/utils";
import type { Comparison, Overview } from "./api";

interface StatTileProps {
  label: string;
  value: string;
  icon: ReactNode;
  footer: ReactNode;
  href?: string;
  trend?: number[];
  tone?: "default" | "critical";
}

function StatTile({ label, value, icon, footer, href, trend, tone = "default" }: StatTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            tone === "critical" ? "bg-danger-soft text-danger-soft-foreground" : "bg-primary-soft text-primary-soft-foreground",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[28px] leading-none font-bold tracking-tight text-foreground sm:text-[32px]">{value}</p>
        {trend && <Sparkline values={trend} />}
      </div>
      <div className="mt-3 text-xs text-muted">{footer}</div>
    </>
  );

  return (
    <Card className={cn("relative p-5", href && "transition-shadow hover:shadow-overlay")}>
      {href ? (
        <Link href={href} className="block after:absolute after:inset-0 after:rounded-2xl" aria-label={`${label}: ${value}`}>
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  );
}

/** 12-point sparkline in the de-emphasis color, with the current period in the accent. */
function Sparkline({ values }: { values: number[] }) {
  const points = values.slice(-12);
  if (points.length < 2) return null;
  const width = 88;
  const height = 32;
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1);
  const coords = points.map((v, i) => [i * step, height - 3 - (v / max) * (height - 6)] as const);
  const path = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const [lastX, lastY] = coords[coords.length - 1]!;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible" aria-hidden="true">
      <path d={path} fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="4" fill="var(--chart-1)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}

/** Signed change vs. the previous period. Admissions going up is neither good nor bad, so it stays neutral. */
function Delta({ comparison, suffix }: { comparison: Comparison; suffix: string }) {
  const { changePct } = comparison;
  if (changePct === null) return <span>{suffix}</span>;
  const Icon = changePct > 0 ? ArrowUpRight : changePct < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 font-semibold text-foreground ring-1 ring-border">
        <Icon className="size-3" aria-hidden="true" />
        {changePct > 0 ? "+" : ""}
        {formatPercent(changePct, Math.abs(changePct) < 10 ? 1 : 0)}
      </span>
      {suffix}
    </span>
  );
}

export function KpiCards({ data, rangeLabel }: { data: Overview; rangeLabel: string }) {
  const { totals, period } = data;
  const criticalShare = totals.patients ? (totals.critical / totals.patients) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Total doctors"
        value={formatCompact(totals.doctors)}
        icon={<Stethoscope className="size-[18px]" />}
        href="/doctors"
        footer={
          <span>
            <span className="font-semibold text-foreground">+{period.newDoctors.current}</span> joined in the {rangeLabel}
          </span>
        }
      />
      <StatTile
        label="Total patients"
        value={formatCompact(totals.patients)}
        icon={<Users className="size-[18px]" />}
        href="/patients"
        footer={
          <span>
            <span className="font-semibold text-foreground">{totals.avgPatientsPerDoctor}</span> patients per doctor on average
          </span>
        }
      />
      <StatTile
        label="Admissions"
        value={formatCompact(period.admissions.current)}
        icon={<Activity className="size-[18px]" />}
        trend={data.admissionsTrend.map((p) => p.admissions)}
        footer={<Delta comparison={period.admissions} suffix={`vs previous ${rangeLabel}`} />}
      />
      <StatTile
        label="Critical patients"
        value={formatCompact(totals.critical)}
        tone="critical"
        icon={<AlertTriangle className="size-[18px]" />}
        href="/patients?condition=critical"
        footer={
          <span>
            <span className="font-semibold text-foreground">{formatPercent(criticalShare, 1)}</span> of all patients need
            immediate care
          </span>
        }
      />
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-40" />
        </Card>
      ))}
    </div>
  );
}
