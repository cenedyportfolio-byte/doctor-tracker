"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useCanEdit } from "@/features/auth/api";
import { CONDITION_ICONS } from "@/features/patients/condition-badge";
import { PatientList } from "@/features/patients/patient-list";
import { ApiError } from "@/lib/api-client";
import { CONDITION_META, CONDITIONS_BY_SEVERITY } from "@/lib/constants";
import { formatDate, formatNumber, formatRelative } from "@/lib/utils";
import { useDoctor } from "./api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";
import type { DoctorDetail } from "./types";

export function DoctorDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: doctor, error, isPending, refetch } = useDoctor(id);
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isPending) return <DoctorDetailSkeleton />;

  if (error || !doctor) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <Card>
        {notFound ? (
          <EmptyState
            icon={UserX}
            title="Doctor not found"
            description="This doctor may have been removed, or the link is incorrect."
            action={
              <Link href="/doctors" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                Back to doctors
              </Link>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={() => void refetch()} />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <title>{`${doctor.name} · Doctor Tracker`}</title>

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link href="/doctors" className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-foreground">
          <ArrowLeft className="size-4 sm:hidden" aria-hidden="true" />
          Doctors
        </Link>
        <ChevronRight className="hidden size-3.5 text-subtle sm:block" aria-hidden="true" />
        <span className="hidden truncate font-semibold text-foreground sm:block" aria-current="page">
          {doctor.name}
        </span>
      </nav>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={doctor.name} size="lg" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{doctor.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone="primary">{doctor.specialization}</Badge>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Building2 className="size-4" aria-hidden="true" />
                  {doctor.hospital}
                </span>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} aria-label="Edit doctor">
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleting(true)}
                className="text-danger-soft-foreground"
                aria-label="Delete doctor"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <Detail icon={<Mail className="size-4" />} label="Email">
            <a href={`mailto:${doctor.email}`} className="truncate hover:text-primary">
              {doctor.email}
            </a>
          </Detail>
          <Detail icon={<Phone className="size-4" />} label="Phone">
            <a href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
              {doctor.phone}
            </a>
          </Detail>
          <Detail icon={<CalendarDays className="size-4" />} label="Joined">
            {formatDate(doctor.createdAt)}
          </Detail>
          <Detail icon={<Clock className="size-4" />} label="Last admission">
            {doctor.lastAdmissionAt ? formatRelative(doctor.lastAdmissionAt) : "No admissions yet"}
          </Detail>
        </dl>

        <ConditionBreakdown doctor={doctor} />
      </Card>

      <PatientList doctor={{ id: doctor.id, name: doctor.name }} />

      <DoctorFormDialog state={editing ? { mode: "edit", doctor } : null} onClose={() => setEditing(false)} />
      <DeleteDoctorDialog
        doctor={deleting ? doctor : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => router.replace("/doctors")}
      />
    </div>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle ring-1 ring-border">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted">{label}</dt>
        <dd className="truncate text-sm font-semibold text-foreground">{children}</dd>
      </div>
    </div>
  );
}

/** Patient mix as a 100% stacked bar plus a labelled legend (identity never relies on color alone). */
function ConditionBreakdown({ doctor }: { doctor: DoctorDetail }) {
  const total = doctor.patientCount;
  const active = total - doctor.patientsByCondition.discharged;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Patient mix</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{formatNumber(total)}</span> total ·{" "}
          <span className="font-semibold text-foreground">{formatNumber(active)}</span> under active care
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">No patients assigned yet.</p>
      ) : (
        <>
          <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            {CONDITIONS_BY_SEVERITY.map((condition) => {
              const count = doctor.patientsByCondition[condition];
              return count > 0 ? (
                <div
                  key={condition}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(count / total) * 100}%`, background: CONDITION_META[condition].chartColor }}
                />
              ) : null;
            })}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CONDITIONS_BY_SEVERITY.map((condition) => {
              const Icon = CONDITION_ICONS[condition];
              const count = doctor.patientsByCondition[condition];
              return (
                <li key={condition} className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5 ring-1 ring-border">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: CONDITION_META[condition].chartColor }} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Icon className="size-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{CONDITION_META[condition].label}</span>
                    </p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatNumber(count)}
                      <span className="ml-1 text-xs font-normal text-subtle">{Math.round((count / total) * 100)}%</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function DoctorDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading doctor">
      <Skeleton className="h-4 w-40" />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <Skeleton className="mt-6 h-2.5 w-full rounded-full" />
      </Card>
      <Card className="h-96" />
    </div>
  );
}
