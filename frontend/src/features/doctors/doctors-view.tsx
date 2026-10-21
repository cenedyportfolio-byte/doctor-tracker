"use client";

import { Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { describeDateRange } from "@/components/filters/date-range-filter";
import { FilterChips, type ActiveFilter } from "@/components/filters/filter-chips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, ProgressBar } from "@/components/ui/states";
import { useCanEdit } from "@/features/auth/api";
import { useIsDesktop } from "@/hooks/use-media-query";
import { DOCTOR_SORTS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { useDoctors } from "./api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFiltersSheet } from "./doctor-filters-sheet";
import { DoctorFormDialog, type DoctorFormState } from "./doctor-form-dialog";
import { DoctorCardList, DoctorRowsSkeleton, DoctorsTable } from "./doctor-rows";
import type { Doctor, DoctorSort } from "./types";
import { useDoctorListParams } from "./use-doctor-list-params";

export function DoctorsView() {
  const { params, update, reset } = useDoctorListParams();
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useDoctors(params);
  const canEdit = useCanEdit();
  const isDesktop = useIsDesktop();

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
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description={
          data
            ? `${formatNumber(data.meta.total)} ${activeFilters.length ? "matching" : "registered"} doctor${data.meta.total === 1 ? "" : "s"}`
            : "Manage the doctor directory"
        }
        actions={
          canEdit && (
            <Button onClick={() => setForm({ mode: "create" })}>
              <Plus className="size-4" />
              Add doctor
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <SearchInput
            key={searchKey}
            defaultValue={params.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, email, hospital, phone…"
            label="Search doctors"
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
              aria-label="Sort doctors"
              value={params.sort}
              onChange={(e) => onSortChange(e.target.value as DoctorSort)}
              className="flex-1 sm:w-44 sm:flex-none"
            >
              {DOCTOR_SORTS.map((s) => (
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
            <DoctorRowsSkeleton rows={params.limit > 10 ? 10 : params.limit} />
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
                description="Add the first doctor to start tracking their patients."
                action={
                  canEdit && (
                    <Button size="sm" onClick={() => setForm({ mode: "create" })}>
                      <Plus className="size-4" />
                      Add doctor
                    </Button>
                  )
                }
              />
            )
          ) : isDesktop ? (
            <DoctorsTable
              doctors={doctors}
              sort={params.sort}
              onSortChange={onSortChange}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              dimmed={isPlaceholderData}
            />
          ) : (
            <DoctorCardList
              doctors={doctors}
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
