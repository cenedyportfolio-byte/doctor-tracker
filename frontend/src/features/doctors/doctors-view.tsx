"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { describeDateRange } from "@/components/filters/date-range-filter";
import { FilterChips, type ActiveFilter } from "@/components/filters/filter-chips";
import { ListToolbar } from "@/components/filters/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, ProgressBar } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/table";
import { useCanEdit } from "@/features/auth/api";
import { DOCTOR_SORTS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { useDoctors } from "./api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFiltersSheet } from "./doctor-filters-sheet";
import { DoctorFormDialog, type DoctorFormState } from "./doctor-form-dialog";
import { DoctorsTable } from "./doctor-rows";
import type { Doctor, DoctorSort } from "./types";
import { useDoctorListParams } from "./use-doctor-list-params";

export function DoctorsView() {
  const { params, update, reset } = useDoctorListParams();
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useDoctors(params);
  const canEdit = useCanEdit();

  const [form, setForm] = useState<DoctorFormState>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Bumped to remount the search box / filter sheet with fresh state.
  const [searchKey, setSearchKey] = useState(0);
  const [filtersKey, setFiltersKey] = useState(0);

  // Stable callbacks keep memoized rows from re-rendering on unrelated state changes.
  const onEdit = useCallback((doctor: Doctor) => setForm({ mode: "edit", doctor }), []);
  const onDelete = useCallback((doctor: Doctor) => setDeleting(doctor), []);
  const onSortChange = useCallback((sort: DoctorSort) => update({ sort }), [update]);
  const onPageChange = useCallback(
    (page: number) => {
      update({ page }, { resetPage: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [update],
  );
  const onPageSizeChange = useCallback((limit: number) => update({ limit }), [update]);

  // If the current page no longer exists (e.g. after deleting its last row), step back.
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
    for (const specialization of params.specialization) {
      filters.push({
        key: `spec-${specialization}`,
        label: specialization,
        onRemove: () => update({ specialization: params.specialization.filter((s) => s !== specialization) }),
      });
    }
    if (params.hospital) {
      filters.push({ key: "hospital", label: params.hospital, onRemove: () => update({ hospital: undefined }) });
    }
    const joined = describeDateRange({ from: params.from, to: params.to });
    if (joined) {
      filters.push({
        key: "joined",
        label: `Joined: ${joined}`,
        onRemove: () => update({ from: undefined, to: undefined }),
      });
    }
    return filters;
  }, [params, update]);

  const filterCount = params.specialization.length + (params.hospital ? 1 : 0) + (params.from || params.to ? 1 : 0);
  const doctors = data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Doctors"
        description={
          data
            ? `${formatNumber(data.meta.total)} ${activeFilters.length ? "matching" : "registered"} doctor${data.meta.total === 1 ? "" : "s"}`
            : "Doctor directory"
        }
      />

      <Card className="overflow-hidden">
        <ListToolbar
          searchKey={searchKey}
          search={params.search}
          onSearch={(search) => update({ search })}
          searchPlaceholder="Search name, email, hospital, phone…"
          searchLabel="Search doctors"
          filterCount={filterCount}
          onOpenFilters={() => {
            setFiltersKey((k) => k + 1);
            setFiltersOpen(true);
          }}
          sort={params.sort}
          sortOptions={DOCTOR_SORTS}
          onSortChange={onSortChange}
          sortLabel="Sort doctors"
          action={
            canEdit && (
              <Button onClick={() => setForm({ mode: "create" })}>
                <Plus className="size-4" />
                Add doctor
              </Button>
            )
          }
        />

        {activeFilters.length > 0 && (
          <div className="px-3 pb-3 sm:px-4">
            <FilterChips filters={activeFilters} onClearAll={clearAll} />
          </div>
        )}

        <div className="relative">
          <ProgressBar active={isFetching && !isPending} />
          {isPending ? (
            <TableSkeleton rows={Math.min(params.limit, 10)} label="Loading doctors" />
          ) : error && !data ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : doctors.length === 0 ? (
            activeFilters.length > 0 ? (
              <EmptyState
                title="No doctors match your filters"
                description="Try a different search term or remove some filters."
                action={
                  <Button variant="secondary" size="sm" onClick={clearAll}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No doctors yet"
                description={canEdit ? "Add the first doctor to start tracking their patients." : undefined}
              />
            )
          ) : (
            <DoctorsTable
              doctors={doctors}
              sort={params.sort}
              onSortChange={onSortChange}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              dimmed={isPlaceholderData}
            />
          )}
        </div>

        {data && data.meta.total > 0 && (
          <Pagination
            meta={data.meta}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            noun="doctors"
          />
        )}
      </Card>

      <DoctorFormDialog state={form} onClose={() => setForm(null)} />
      <DeleteDoctorDialog doctor={deleting} onClose={() => setDeleting(null)} />
      <DoctorFiltersSheet
        key={filtersKey}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initial={params}
        onApply={(filters) => update(filters)}
      />
    </div>
  );
}
