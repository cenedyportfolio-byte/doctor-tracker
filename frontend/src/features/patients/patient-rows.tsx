"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTh, Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { GENDER_LABEL } from "@/lib/constants";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { ConditionBadge } from "./condition-badge";
import type { Patient, PatientSort } from "./types";

interface RowActions {
  canEdit: boolean;
  showDoctor: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

interface PatientsTableProps extends RowActions {
  patients: Patient[];
  sort: PatientSort;
  onSortChange: (sort: PatientSort) => void;
  dimmed?: boolean;
}

export function PatientsTable({ patients, sort, onSortChange, dimmed, ...actions }: PatientsTableProps) {
  const nameDirection = sort === "name_asc" ? "asc" : sort === "name_desc" ? "desc" : null;
  const admittedDirection = sort === "newest" ? "desc" : sort === "oldest" ? "asc" : null;

  return (
    <Table className={cn("transition-opacity", dimmed && "opacity-60")}>
      <THead>
        <tr>
          <SortableTh
            direction={nameDirection}
            onSort={() => onSortChange(sort === "name_asc" ? "name_desc" : "name_asc")}
          >
            Patient
          </SortableTh>
          <Th>Age · Gender</Th>
          <Th>Diagnosis</Th>
          <Th>Condition</Th>
          {actions.showDoctor && <Th>Doctor</Th>}
          <SortableTh
            direction={admittedDirection}
            onSort={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
          >
            Admitted
          </SortableTh>
          {actions.canEdit && (
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          )}
        </tr>
      </THead>
      <tbody>
        {patients.map((patient) => (
          <PatientRow key={patient.id} patient={patient} {...actions} />
        ))}
      </tbody>
    </Table>
  );
}

const PatientRow = memo(function PatientRow({
  patient,
  canEdit,
  showDoctor,
  onEdit,
  onDelete,
}: RowActions & { patient: Patient }) {
  return (
    <Tr className="group">
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{patient.name}</p>
            <p className="max-w-52 truncate text-xs text-muted">{patient.email ?? patient.phone}</p>
          </div>
        </div>
      </Td>
      <Td className="whitespace-nowrap text-muted">
        <span className="font-medium text-foreground tabular-nums">{patient.age}</span> · {GENDER_LABEL[patient.gender]}
      </Td>
      <Td className="max-w-48 truncate text-foreground">{patient.diagnosis}</Td>
      <Td>
        <ConditionBadge condition={patient.condition} />
      </Td>
      {showDoctor && (
        <Td>
          {patient.doctor ? (
            <Link href={`/doctors/${patient.doctor.id}`} className="group/doc block max-w-44">
              <span className="block truncate font-medium text-foreground group-hover/doc:text-primary">
                {patient.doctor.name}
              </span>
              <span className="block truncate text-xs text-muted">{patient.doctor.specialization}</span>
            </Link>
          ) : (
            <span className="text-subtle">—</span>
          )}
        </Td>
      )}
      <Td className="whitespace-nowrap">
        <p className="text-foreground">{formatDate(patient.admissionDate)}</p>
        <p className="text-xs text-muted">{formatRelative(patient.admissionDate)}</p>
      </Td>
      {canEdit && (
        <Td>
          <div className="flex justify-end gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(patient)} aria-label={`Edit ${patient.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="danger-ghost"
              size="icon-sm"
              onClick={() => onDelete(patient)}
              aria-label={`Delete ${patient.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </Td>
      )}
    </Tr>
  );
});

export function PatientCardList({ patients, dimmed, ...actions }: RowActions & { patients: Patient[]; dimmed?: boolean }) {
  return (
    <ul className={cn("divide-y divide-border transition-opacity", dimmed && "opacity-60")}>
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} {...actions} />
      ))}
    </ul>
  );
}

const PatientCard = memo(function PatientCard({
  patient,
  canEdit,
  showDoctor,
  onEdit,
  onDelete,
}: RowActions & { patient: Patient }) {
  return (
    <li className="px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar name={patient.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{patient.name}</p>
              <p className="text-xs text-muted">
                {patient.age} · {GENDER_LABEL[patient.gender]} · {patient.diagnosis}
              </p>
            </div>
            <ConditionBadge condition={patient.condition} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="min-w-0 truncate">
              {showDoctor && patient.doctor ? (
                <Link href={`/doctors/${patient.doctor.id}`} className="font-medium text-foreground hover:text-primary">
                  {patient.doctor.name}
                </Link>
              ) : null}
              {showDoctor && patient.doctor ? " · " : ""}
              Admitted {formatDate(patient.admissionDate, "MMM d")}
            </span>
            {canEdit && (
              <span className="-my-1 -mr-1 flex shrink-0 gap-0.5">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(patient)} aria-label={`Edit ${patient.name}`}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="danger-ghost"
                  size="icon-sm"
                  onClick={() => onDelete(patient)}
                  aria-label={`Delete ${patient.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
});

export function PatientRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-label="Loading patients" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="hidden h-3.5 w-28 md:block" />
          <Skeleton className="hidden h-5 w-24 rounded-full md:block" />
          <Skeleton className="hidden h-3.5 w-32 lg:block" />
        </div>
      ))}
    </div>
  );
}
