"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardPlus, Plus, SearchX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { describeDateRange } from "@/components/filters/date-range-filter";
import { FilterChips, type ActiveFilter } from "@/components/filters/filter-chips";
import { ListToolbar } from "@/components/filters/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, ProgressBar } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/table";
import { useCanEdit } from "@/features/auth/api";
import { doctorDetailQuery } from "@/features/doctors/api";
import type { PickedDoctor } from "@/features/doctors/doctor-picker";
import { errorMessage } from "@/lib/api-client";
import { CONDITION_META, GENDER_LABEL, PATIENT_SORTS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { useDeletePatient, usePatients } from "./api";
import { PatientFiltersSheet } from "./patient-filters-sheet";
import { PatientFormDialog, type PatientFormState } from "./patient-form-dialog";
import { PatientDetailsSheet } from "./patient-details-sheet";
import { PatientsTable } from "./patient-rows";
import type { Patient, PatientSort } from "./types";
import { usePatientListParams } from "./use-patient-list-params";

interface PatientListProps {
  /** When set, lists only this doctor's patients and creates new ones under them. */
  doctor?: PickedDoctor;
}

export function PatientList({ doctor }: PatientListProps) {
  const { params, update, reset } = usePatientListParams();
  const scoped = Boolean(doctor);
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = usePatients(params, {
    doctorId: doctor?.id,
  });
  const deletePatient = useDeletePatient();
  const canEdit = useCanEdit();

  // Name for the "Doctor: …" chip when filtering by doctor via the URL.
  const { data: filterDoctor } = useQuery({
    ...doctorDetailQuery(params.doctor ?? ""),
    enabled: !scoped && Boolean(params.doctor),
  });

  const [form, setForm] = useState<PatientFormState>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [filtersKey, setFiltersKey] = useState(0);

  const onOpen = useCallback((patient: Patient) => setViewing(patient), []);
  const onEdit = useCallback((patient: Patient) => setForm({ mode: "edit", patient }), []);
  const onDelete = useCallback((patient: Patient) => setDeleting(patient), []);
  const onSortChange = useCallback((sort: PatientSort) => update({ sort }), [update]);
  const onPageChange = useCallback(
    (page: number) => {
      update({ page }, { resetPage: false });
      if (!scoped) window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [update, scoped],
  );
  const onPageSizeChange = useCallback((limit: number) => update({ limit }), [update]);
  const openCreate = () => setForm({ mode: "create", doctor });

  const lastPage = data?.meta.totalPages;
  useEffect(() => {
    if (lastPage && params.page > lastPage) update({ page: lastPage }, { resetPage: false });
  }, [lastPage, params.page, update]);

  const clearAll = useCallback(() => {
    reset(["limit", "sort"]);
    setSearchKey((k) => k + 1);
  }, [reset]);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = [];
    if (params.search) {
      filters.push({
        key: "search",
        label: `“${params.search}”`,
        onRemove: () => {
          update({ search: undefined });
          setSearchKey((k) => k + 1);
        },
      });
    }
    for (const condition of params.condition) {
      filters.push({
        key: `condition-${condition}`,
        label: CONDITION_META[condition].label,
        onRemove: () => update({ condition: params.condition.filter((c) => c !== condition) }),
      });
    }
    if (params.doctor && !scoped) {
      filters.push({
        key: "doctor",
        label: `Doctor: ${filterDoctor?.name ?? "…"}`,
        onRemove: () => update({ doctor: undefined }),
      });
    }
    if (params.gender) {
      filters.push({ key: "gender", label: GENDER_LABEL[params.gender], onRemove: () => update({ gender: undefined }) });
    }
    if (params.minAge !== undefined || params.maxAge !== undefined) {
      const label =
        params.minAge !== undefined && params.maxAge !== undefined
          ? `Age ${params.minAge}–${params.maxAge}`
          : params.minAge !== undefined
            ? `Age ${params.minAge}+`
            : `Age ≤ ${params.maxAge}`;
      filters.push({ key: "age", label, onRemove: () => update({ minAge: undefined, maxAge: undefined }) });
    }
    const admitted = describeDateRange({ from: params.from, to: params.to });
    if (admitted) {
      filters.push({
        key: "admitted",
        label: `Admitted: ${admitted}`,
        onRemove: () => update({ from: undefined, to: undefined }),
      });
    }
    return filters;
  }, [params, update, scoped, filterDoctor?.name]);

  const filterCount =
    params.condition.length +
    (params.gender ? 1 : 0) +
    (params.doctor && !scoped ? 1 : 0) +
    (params.minAge !== undefined || params.maxAge !== undefined ? 1 : 0) +
    (params.from || params.to ? 1 : 0);

  const patients = data?.data ?? [];
  const total = data?.meta.total;
  const countLabel =
    total === undefined
      ? scoped
        ? "Patients under this doctor's care"
        : "Manage patient records"
      : `${formatNumber(total)} ${activeFilters.length ? "matching" : scoped ? "assigned" : "registered"} patient${total === 1 ? "" : "s"}`;

  const addButton = canEdit && (
    <Button onClick={openCreate}>
      <Plus className="size-4" />
      <span className="sm:hidden">Add</span>
      <span className="hidden sm:inline">Add patient</span>
    </Button>
  );

  return (
    <div className={scoped ? "space-y-3" : "space-y-4"}>
      {scoped ? (
        <div>
          <h2 id="doctor-patients-heading" className="text-base font-semibold text-foreground">
            Patients
          </h2>
          <p className="text-sm text-muted">{countLabel}</p>
        </div>
      ) : (
        <PageHeader title="Patients" description={countLabel} />
      )}

      <Card className="overflow-hidden" aria-labelledby={scoped ? "doctor-patients-heading" : undefined}>
        <ListToolbar
          searchKey={searchKey}
          search={params.search}
          onSearch={(search) => update({ search })}
          searchPlaceholder="Search name, diagnosis, phone, email…"
          searchLabel="Search patients"
          filterCount={filterCount}
          onOpenFilters={() => {
            setFiltersKey((k) => k + 1);
            setFiltersOpen(true);
          }}
          sort={params.sort}
          sortOptions={PATIENT_SORTS}
          onSortChange={onSortChange}
          sortLabel="Sort patients"
          action={addButton}
        />

        {activeFilters.length > 0 && (
          <div className="px-3 pb-3 sm:px-4">
            <FilterChips filters={activeFilters} onClearAll={clearAll} />
          </div>
        )}

        <div className="relative">
          <ProgressBar active={isFetching && !isPending} />
          {isPending ? (
            <TableSkeleton rows={Math.min(params.limit, 10)} label="Loading patients" />
          ) : error && !data ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : patients.length === 0 ? (
            activeFilters.length > 0 ? (
              <EmptyState
                icon={SearchX}
                title="No patients match your filters"
                description="Try a different search term or remove some filters."
                action={
                  <Button variant="secondary" size="sm" onClick={clearAll}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardPlus}
                title={scoped ? "No patients assigned yet" : "No patients yet"}
                description={scoped ? "Patients added under this doctor will appear here." : undefined}
              />
            )
          ) : (
            <PatientsTable
              patients={patients}
              sort={params.sort}
              onSortChange={onSortChange}
              canEdit={canEdit}
              showDoctor={!scoped}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              dimmed={isPlaceholderData}
            />
          )}
        </div>

        {data && data.meta.total > 0 && (
          <Pagination meta={data.meta} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} noun="patients" />
        )}
      </Card>

      <PatientDetailsSheet
        patient={viewing}
        canEdit={canEdit}
        onClose={() => setViewing(null)}
        onEdit={(patient) => {
          setViewing(null);
          onEdit(patient);
        }}
        onDelete={(patient) => {
          setViewing(null);
          onDelete(patient);
        }}
      />

      <PatientFormDialog state={form} onClose={() => setForm(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={scoped ? "Remove patient?" : "Delete patient?"}
        confirmLabel={scoped ? "Remove patient" : "Delete patient"}
        loading={deletePatient.isPending}
        description={
          <>
            <strong className="text-foreground">{deleting?.name}</strong>
            {scoped ? ` will be removed from ${doctor?.name}'s patient list and their record deleted.` : "'s record will be permanently deleted."}{" "}
            This can&apos;t be undone.
          </>
        }
        onConfirm={() => {
          if (!deleting) return;
          deletePatient.mutate(
            { id: deleting.id, doctorId: doctor?.id },
            {
              onSuccess: () => {
                toast.success(scoped ? "Patient removed" : "Patient deleted", {
                  description: `${deleting.name}'s record was deleted.`,
                });
                setDeleting(null);
              },
              onError: (err) => toast.error("Couldn't delete patient", { description: errorMessage(err) }),
            },
          );
        }}
      />

      <PatientFiltersSheet
        key={filtersKey}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={params}
        initialDoctor={params.doctor && filterDoctor ? { id: filterDoctor.id, name: filterDoctor.name } : null}
        showDoctor={!scoped}
        onApply={(filters) => update(filters)}
      />
    </div>
  );
}

