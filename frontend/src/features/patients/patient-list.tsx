"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { describeDateRange } from "@/components/filters/date-range-filter";
import { FilterChips, type ActiveFilter } from "@/components/filters/filter-chips";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, ProgressBar } from "@/components/ui/states";
import { useCanEdit } from "@/features/auth/api";
import { doctorDetailQuery } from "@/features/doctors/api";
import type { PickedDoctor } from "@/features/doctors/doctor-picker";
import { useIsDesktop } from "@/hooks/use-media-query";
import { errorMessage } from "@/lib/api-client";
import { CONDITION_META, CONDITIONS_BY_SEVERITY, GENDER_LABEL, PATIENT_SORTS } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";
import { useDeletePatient, usePatients } from "./api";
import { PatientFiltersSheet } from "./patient-filters-sheet";
import { PatientFormDialog, type PatientFormState } from "./patient-form-dialog";
import { PatientCardList, PatientRowsSkeleton, PatientsTable } from "./patient-rows";
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
  const isDesktop = useIsDesktop();

  // Name for the "Doctor: …" chip when filtering by doctor via the URL.
  const { data: filterDoctor } = useQuery({
    ...doctorDetailQuery(params.doctor ?? ""),
    enabled: !scoped && Boolean(params.doctor),
  });

  const [form, setForm] = useState<PatientFormState>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [filtersKey, setFiltersKey] = useState(0);

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
    <Button onClick={openCreate} size={scoped ? "sm" : "md"}>
      <Plus className="size-4" />
      Add patient
    </Button>
  );

  return (
    <div className="space-y-6">
      {!scoped && <PageHeader title="Patients" description={countLabel} actions={addButton} />}

      <Card className="overflow-hidden" aria-labelledby={scoped ? "doctor-patients-heading" : undefined}>
        {scoped && (
          <CardHeader id="doctor-patients-heading" title="Patients" description={countLabel} action={addButton} />
        )}

        {/* Quick condition filter */}
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto px-4 pt-4 sm:px-5"
          role="radiogroup"
          aria-label="Filter by condition"
        >
          <ConditionPill active={params.condition.length === 0} onClick={() => update({ condition: undefined })}>
            All
          </ConditionPill>
          {CONDITIONS_BY_SEVERITY.map((condition) => {
            const active = params.condition.length === 1 && params.condition[0] === condition;
            return (
              <ConditionPill
                key={condition}
                active={active}
                onClick={() => update({ condition: active ? undefined : [condition] })}
              >
                {CONDITION_META[condition].label}
              </ConditionPill>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <SearchInput
            key={searchKey}
            defaultValue={params.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, diagnosis, phone, email…"
            label="Search patients"
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => {
                setFiltersKey((k) => k + 1);
                setFiltersOpen(true);
              }}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {filterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                  {filterCount}
                </span>
              )}
            </Button>
            <Select
              aria-label="Sort patients"
              value={params.sort}
              onChange={(e) => onSortChange(e.target.value as PatientSort)}
              className="flex-1 sm:w-48 sm:flex-none"
            >
              {PATIENT_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="px-4 pb-4 sm:px-5">
            <FilterChips filters={activeFilters} onClearAll={clearAll} />
          </div>
        )}

        <div className="relative border-t border-border md:border-t-0">
          <ProgressBar active={isFetching && !isPending} />
          {isPending ? (
            <PatientRowsSkeleton rows={Math.min(params.limit, 10)} />
          ) : error && !data ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : patients.length === 0 ? (
            activeFilters.length > 0 ? (
              <EmptyState
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
                title={scoped ? "No patients assigned yet" : "No patients yet"}
                description={
                  scoped ? "Patients added under this doctor will appear here." : "Add a patient to get started."
                }
                action={
                  canEdit && (
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="size-4" />
                      Add patient
                    </Button>
                  )
                }
              />
            )
          ) : isDesktop ? (
            <PatientsTable
              patients={patients}
              sort={params.sort}
              onSortChange={onSortChange}
              canEdit={canEdit}
              showDoctor={!scoped}
              onEdit={onEdit}
              onDelete={onDelete}
              dimmed={isPlaceholderData}
            />
          ) : (
            <PatientCardList
              patients={patients}
              canEdit={canEdit}
              showDoctor={!scoped}
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

function ConditionPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "bg-foreground text-background" : "bg-surface-2 text-muted ring-1 ring-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
