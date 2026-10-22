import { BedDouble, HeartPulse, Stethoscope, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { Comparison, Overview } from "./api";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail: ReactNode;
  href?: string;
}

function StatTile({ icon: Icon, label, value, detail, href }: StatTileProps) {
  return (
    <div className="relative rounded-lg border border-border bg-surface p-4">
      <Icon className="absolute top-4 right-4 size-4 text-subtle" aria-hidden="true" />
      <p className="pr-6 text-xs text-muted">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 hover:underline">
            {label}
          </Link>
        ) : (
          label
        )}
      </p>
      <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</div>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function change({ changePct }: Comparison): string {
  if (changePct === null) return "no earlier data";
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${formatPercent(changePct, Math.abs(changePct) < 10 ? 1 : 0)}`;
}

interface StatTilesProps {
  data: Overview | undefined;
  loading: boolean;
  rangeLabel: string;
}

export function StatTiles({ data, loading, rangeLabel }: StatTilesProps) {
  const placeholder = loading ? <Skeleton className="h-7 w-16" /> : "—";
  const discharged = data?.patientsByCondition.find((row) => row.condition === "discharged")?.count ?? 0;
  const criticalShare = data && data.totals.patients ? (data.totals.critical / data.totals.patients) * 100 : 0;

  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={Stethoscope}
        label="Doctors"
        href="/doctors"
        value={data ? formatNumber(data.totals.doctors) : placeholder}
        detail={data ? `${data.totals.avgPatientsPerDoctor} patients per doctor` : "\u00a0"}
      />
      <StatTile
        icon={Users}
        label="Patients"
        href="/patients"
        value={data ? formatNumber(data.totals.patients) : placeholder}
        detail={data ? `${formatNumber(data.totals.patients - discharged)} under active care` : "\u00a0"}
      />
      <StatTile
        icon={HeartPulse}
        label="Critical patients"
        href="/patients?condition=critical"
        value={data ? formatNumber(data.totals.critical) : placeholder}
        detail={data ? `${formatPercent(criticalShare, 1)} of all patients` : "\u00a0"}
      />
      <StatTile
        icon={BedDouble}
        label={`Admitted, ${rangeLabel}`}
        value={data ? formatNumber(data.period.admissions.current) : placeholder}
        detail={data ? `${change(data.period.admissions)} vs previous ${rangeLabel.replace("last ", "")}` : "\u00a0"}
      />
    </section>
  );
}
