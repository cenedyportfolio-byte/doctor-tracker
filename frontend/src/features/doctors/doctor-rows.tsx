"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SortableTh, Table, Td, Th, THead, Tr } from "@/components/ui/table";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { doctorDetailQuery } from "./api";
import type { Doctor, DoctorSort } from "./types";

interface RowActions {
  canEdit: boolean;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

interface DoctorsTableProps extends RowActions {
  doctors: Doctor[];
  sort: DoctorSort;
  onSortChange: (sort: DoctorSort) => void;
  dimmed?: boolean;
}

function usePrefetchDoctor() {
  const queryClient = useQueryClient();
  // Hovering a row loads the profile in the background, so opening it is instant.
  return useCallback((id: string) => void queryClient.prefetchQuery(doctorDetailQuery(id)), [queryClient]);
}

/**
 * Columns appear as space allows: phones show doctor + patient count (tap a row to open the
 * profile, where edit/delete live); wider screens add practice, actions, joined date and phone.
 */
export function DoctorsTable({ doctors, sort, onSortChange, dimmed, ...actions }: DoctorsTableProps) {
  const prefetch = usePrefetchDoctor();
  const nameDirection = sort === "name_asc" ? "asc" : sort === "name_desc" ? "desc" : null;
  const joinedDirection = sort === "newest" ? "desc" : sort === "oldest" ? "asc" : null;

  return (
    <Table className={cn("transition-opacity", dimmed && "opacity-60")}>
      <THead>
        <tr>
          <SortableTh
            direction={nameDirection}
            onSort={() => onSortChange(sort === "name_asc" ? "name_desc" : "name_asc")}
          >
            Doctor
          </SortableTh>
          <Th className="hidden md:table-cell">Practice</Th>
          <Th className="hidden min-[1400px]:table-cell">Phone</Th>
          <Th className="text-right">Patients</Th>
          <SortableTh
            className="hidden xl:table-cell"
            direction={joinedDirection}
            onSort={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
          >
            Joined
          </SortableTh>
          {actions.canEdit && (
            <Th className="hidden md:table-cell">
              <span className="sr-only">Actions</span>
            </Th>
          )}
        </tr>
      </THead>
      <tbody>
        {doctors.map((doctor) => (
          <DoctorRow key={doctor.id} doctor={doctor} onHover={prefetch} {...actions} />
        ))}
      </tbody>
    </Table>
  );
}

const DoctorRow = memo(function DoctorRow({
  doctor,
  canEdit,
  onEdit,
  onDelete,
  onHover,
}: RowActions & { doctor: Doctor; onHover: (id: string) => void }) {
  return (
    <Tr className="relative" onMouseEnter={() => onHover(doctor.id)}>
      <Td>
        {/* The link stretches over the whole row; action buttons sit above it. */}
        <Link
          href={`/doctors/${doctor.id}`}
          className="font-medium text-foreground after:absolute after:inset-0 hover:underline"
        >
          {doctor.name}
        </Link>
        <p className="max-w-56 truncate text-xs text-muted">
          <span className="md:hidden">{doctor.specialization}</span>
          <span className="hidden md:inline">{doctor.email}</span>
        </p>
      </Td>
      <Td className="hidden md:table-cell">
        <p className="text-foreground">{doctor.specialization}</p>
        <p className="max-w-52 truncate text-xs text-muted">{doctor.hospital}</p>
      </Td>
      <Td className="hidden whitespace-nowrap text-muted tabular-nums min-[1400px]:table-cell">{doctor.phone}</Td>
      <Td className="text-right tabular-nums">{formatNumber(doctor.patientCount)}</Td>
      <Td className="hidden whitespace-nowrap text-muted xl:table-cell">{formatDate(doctor.createdAt)}</Td>
      {canEdit && (
        <Td className="hidden md:table-cell">
          <div className="relative z-10 flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(doctor)} aria-label={`Edit ${doctor.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="danger-ghost"
              size="icon-sm"
              onClick={() => onDelete(doctor)}
              aria-label={`Delete ${doctor.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </Td>
      )}
    </Tr>
  );
});
