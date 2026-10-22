"use client";

import { ArrowLeft, Pencil, Stethoscope, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useCanEdit } from "@/features/auth/api";
import { PatientList } from "@/features/patients/patient-list";
import { ApiError } from "@/lib/api-client";
import { CONDITION_META, CONDITIONS_BY_SEVERITY } from "@/lib/constants";
import { SPECIALIZATION_ICONS } from "@/lib/specialization-icons";
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
            icon={Stethoscope}
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

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/doctors" className="inline-flex items-center gap-1 py-0.5 hover:text-foreground hover:underline">
          <ArrowLeft className="size-3.5 sm:hidden" aria-hidden="true" />
          Doctors
        </Link>
        <span className="hidden sm:inline" aria-hidden="true">
          /
        </span>
        <span className="hidden truncate text-foreground sm:inline" aria-current="page">
          {doctor.name}
        </span>
      </nav>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <SpecializationMark specialization={doctor.specialization} />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">{doctor.name}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {doctor.specialization} · {doctor.hospital}
              </p>
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

        <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Email">
            <a href={`mailto:${doctor.email}`} className="inline-block max-w-full truncate py-0.5 align-top hover:underline">
              {doctor.email}
            </a>
          </Detail>
          <Detail label="Phone">
            <a href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`} className="inline-block py-0.5 align-top hover:underline">
              {doctor.phone}
            </a>
          </Detail>
          <Detail label="Joined">{formatDate(doctor.createdAt)}</Detail>
          <Detail label="Last admission">
            {doctor.lastAdmissionAt ? formatRelative(doctor.lastAdmissionAt) : "No admissions yet"}
          </Detail>
        </dl>

        <PatientMix doctor={doctor} />
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

/** A <div> wrapping one dt/dd pair is valid inside <dl>. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-foreground">{children}</dd>
    </div>
  );
}

/** Patients by condition: one proportional bar plus counts with labels (never color alone). */
function PatientMix({ doctor }: { doctor: DoctorDetail }) {
  const total = doctor.patientCount;
  const active = total - doctor.patientsByCondition.discharged;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h2 className="text-sm text-foreground">
        <span className="font-semibold">{formatNumber(total)}</span> patient{total === 1 ? "" : "s"}
        <span className="text-muted"> · {formatNumber(active)} under active care</span>
      </h2>
      {total > 0 && (
        <>
          <div className="mt-2.5 flex h-2 gap-px overflow-hidden rounded-sm" aria-hidden="true">
            {CONDITIONS_BY_SEVERITY.map((condition) => {
              const count = doctor.patientsByCondition[condition];
              return count > 0 ? (
                <div
                  key={condition}
                  className="h-full"
                  style={{ width: `${(count / total) * 100}%`, background: CONDITION_META[condition].chartColor }}
                />
              ) : null;
            })}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {CONDITIONS_BY_SEVERITY.map((condition) => (
              <li key={condition} className="inline-flex items-center gap-1.5 text-muted">
                <span
                  className="size-2 rounded-full"
                  style={{ background: CONDITION_META[condition].chartColor }}
                  aria-hidden="true"
                />
                {CONDITION_META[condition].label}
                <span className="font-medium text-foreground tabular-nums">
                  {formatNumber(doctor.patientsByCondition[condition])}
                </span>
              </li>
            ))}
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
      <Card className="p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
        <Skeleton className="mt-4 h-2 w-full" />
      </Card>
      <Card className="h-96" />
    </div>
  );
}

function SpecializationMark({ specialization }: { specialization: DoctorDetail["specialization"] }) {
  const Icon = SPECIALIZATION_ICONS[specialization] ?? Stethoscope;
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}
