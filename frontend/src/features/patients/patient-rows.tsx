import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { SortableTh, Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { GENDER_LABEL } from "@/lib/constants";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { ConditionBadge } from "./condition-badge";
import type { Patient, PatientSort } from "./types";

interface RowActions {
  canEdit: boolean;
  showDoctor: boolean;
  onOpen: (patient: Patient) => void;
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
          <Th className="hidden min-[1400px]:table-cell">Diagnosis</Th>
          <Th>Condition</Th>
          {actions.showDoctor && <Th className="hidden xl:table-cell">Doctor</Th>}
          <SortableTh
            className="hidden md:table-cell"
            direction={admittedDirection}
            onSort={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
          >
            Admitted
          </SortableTh>
          {actions.canEdit && (
            <Th className="hidden md:table-cell">
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
  onOpen,
  onEdit,
  onDelete,
}: RowActions & { patient: Patient }) {
  return (
    <Tr className="relative">
      <Td>
        <button
          type="button"
          onClick={() => onOpen(patient)}
          className="cursor-pointer text-left font-medium text-foreground after:absolute after:inset-0 hover:underline"
        >
          {patient.name}
        </button>
        <p className="max-w-40 truncate text-xs text-muted sm:max-w-56">
          <span className="tabular-nums">{patient.age}</span> · {GENDER_LABEL[patient.gender]}
          <span className="min-[1400px]:hidden"> · {patient.diagnosis}</span>
        </p>
      </Td>
      <Td className="hidden max-w-48 truncate text-foreground min-[1400px]:table-cell">{patient.diagnosis}</Td>
      <Td>
        <ConditionBadge condition={patient.condition} />
      </Td>
      {showDoctor && (
        <Td className="hidden xl:table-cell">
          {patient.doctor ? (
            <Link href={`/doctors/${patient.doctor.id}`} className="relative z-10 block max-w-44 hover:underline">
              <span className="block truncate text-foreground">{patient.doctor.name}</span>
              <span className="block truncate text-xs text-muted">{patient.doctor.specialization}</span>
            </Link>
          ) : (
            <span className="text-subtle">—</span>
          )}
        </Td>
      )}
      <Td className="hidden whitespace-nowrap md:table-cell">
        <p className="text-foreground">{formatDate(patient.admissionDate)}</p>
        <p className="text-xs text-muted">{formatRelative(patient.admissionDate)}</p>
      </Td>
      {canEdit && (
        <Td className="hidden md:table-cell">
          <div className="relative z-10 flex justify-end gap-1">
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
