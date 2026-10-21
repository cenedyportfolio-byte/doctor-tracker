"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GENDER_LABEL } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/utils";
import { ConditionBadge } from "./condition-badge";
import type { Patient } from "./types";

interface PatientDetailsSheetProps {
  patient: Patient | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

/** Read-only view of one patient, opened by tapping a row; admins can edit or delete from here. */
export function PatientDetailsSheet({ patient, canEdit, onClose, onEdit, onDelete }: PatientDetailsSheetProps) {
  return (
    <Dialog
      open={patient !== null}
      onClose={onClose}
      variant="sheet"
      title={patient?.name ?? "Patient"}
      description={patient && <ConditionBadge condition={patient.condition} />}
      footer={
        patient && canEdit ? (
          <>
            <Button variant="secondary" className="text-danger-soft-foreground" onClick={() => onDelete(patient)}>
              Delete
            </Button>
            <Button onClick={() => onEdit(patient)}>Edit</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {patient && (
        <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 text-sm">
          <Row label="Age">{patient.age}</Row>
          <Row label="Gender">{GENDER_LABEL[patient.gender]}</Row>
          <Row label="Diagnosis">{patient.diagnosis}</Row>
          <Row label="Doctor">
            {patient.doctor ? (
              <Link href={`/doctors/${patient.doctor.id}`} onClick={onClose} className="underline-offset-2 hover:underline">
                {patient.doctor.name}
                <span className="text-muted"> · {patient.doctor.specialization}</span>
              </Link>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Admitted">
            {formatDate(patient.admissionDate)} <span className="text-muted">({formatRelative(patient.admissionDate)})</span>
          </Row>
          <Row label="Phone">
            <a href={`tel:${patient.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-2 hover:underline">
              {patient.phone}
            </a>
          </Row>
          <Row label="Email">
            {patient.email ? (
              <a href={`mailto:${patient.email}`} className="break-words underline-offset-2 hover:underline">
                {patient.email}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Notes">{patient.notes ? <span className="whitespace-pre-line">{patient.notes}</span> : "—"}</Row>
          <Row label="Record added">{formatDate(patient.createdAt)}</Row>
        </dl>
      )}
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </>
  );
}
