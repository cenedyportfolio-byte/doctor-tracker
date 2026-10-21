"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import { Avatar } from "@/components/ui/avatar";
import { ConditionBadge } from "@/features/patients/condition-badge";
import { formatRelative } from "@/lib/utils";
import type { Overview } from "./api";

export const RecentAdmissions = memo(function RecentAdmissions({
  data,
  className,
}: {
  data: Overview["recentPatients"];
  className?: string;
}) {
  return (
    <ChartCard
      className={className}
      title="Recent admissions"
      description="Latest patients across all doctors"
      action={
        <Link href="/patients" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          View all
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      }
    >
      <ul className="-mx-2 divide-y divide-border">
        {data.map((patient) => (
          <li key={patient.id} className="flex items-center gap-3 px-2 py-2.5">
            <Avatar name={patient.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{patient.name}</p>
              <p className="truncate text-xs text-muted">
                {patient.diagnosis}
                {patient.doctor && (
                  <>
                    {" · "}
                    <Link href={`/doctors/${patient.doctor.id}`} className="hover:text-primary">
                      {patient.doctor.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <ConditionBadge condition={patient.condition} />
              <span className="text-[11px] text-subtle">{formatRelative(patient.admissionDate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
});
