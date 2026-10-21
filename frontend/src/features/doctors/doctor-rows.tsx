"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
          <Th>Specialization</Th>
          <Th>Hospital</Th>
          <Th>Phone</Th>
          <Th className="text-right">Patients</Th>
          <SortableTh direction={joinedDirection} onSort={() => onSortChange(sort === "newest" ? "oldest" : "newest")}>
            Joined
          </SortableTh>
          {actions.canEdit && (
            <Th>
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
    <Tr className="group relative" onMouseEnter={() => onHover(doctor.id)}>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={doctor.name} />
          <div className="min-w-0">
            {/* The link stretches over the whole row; action buttons sit above it. */}
            <Link
              href={`/doctors/${doctor.id}`}
              className="font-semibold text-foreground after:absolute after:inset-0 hover:text-primary"
            >
              {doctor.name}
            </Link>
            <p className="max-w-56 truncate text-xs text-muted">{doctor.email}</p>
          </div>
        </div>
      </Td>
      <Td>
        <Badge tone="primary">{doctor.specialization}</Badge>
      </Td>
      <Td className="max-w-52 truncate text-muted">{doctor.hospital}</Td>
      <Td className="whitespace-nowrap text-muted tabular-nums">{doctor.phone}</Td>
      <Td className="text-right">
        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
          <Users className="size-3.5 text-subtle" aria-hidden="true" />
          {formatNumber(doctor.patientCount)}
        </span>
      </Td>
      <Td className="whitespace-nowrap text-muted">{formatDate(doctor.createdAt)}</Td>
      {canEdit && (
        <Td>
          <div className="relative z-10 flex justify-end gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
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

export function DoctorCardList({ doctors, dimmed, ...actions }: RowActions & { doctors: Doctor[]; dimmed?: boolean }) {
  return (
    <ul className={cn("divide-y divide-border transition-opacity", dimmed && "opacity-60")}>
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} {...actions} />
      ))}
    </ul>
  );
}

const DoctorCard = memo(function DoctorCard({ doctor, canEdit, onEdit, onDelete }: RowActions & { doctor: Doctor }) {
  return (
    <li className="relative px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar name={doctor.name} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/doctors/${doctor.id}`}
            className="block truncate font-semibold text-foreground after:absolute after:inset-0"
          >
            {doctor.name}
          </Link>
          <p className="truncate text-xs text-muted">{doctor.hospital}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{doctor.specialization}</Badge>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
              <Users className="size-3.5" aria-hidden="true" />
              {formatNumber(doctor.patientCount)} patients
            </span>
          </div>
        </div>
        {canEdit ? (
          <div className="relative z-10 -mr-1 flex gap-0.5">
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
        ) : (
          <ChevronRight className="mt-2 size-4 text-subtle" aria-hidden="true" />
        )}
      </div>
    </li>
  );
});

export function DoctorRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-label="Loading doctors" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-5 w-24 rounded-full md:block" />
          <Skeleton className="hidden h-3.5 w-36 lg:block" />
          <Skeleton className="hidden h-3.5 w-12 md:block" />
        </div>
      ))}
    </div>
  );
}
