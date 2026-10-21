import { useState } from "react";
import { DateRangeFilter, type DateRange } from "@/components/filters/date-range-filter";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { ToggleGroup } from "@/components/filters/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { SPECIALIZATIONS, type Specialization } from "@/lib/constants";
import { useDoctorFacets } from "./api";
import type { DoctorListParams } from "./types";

type DoctorFilters = Pick<DoctorListParams, "specialization" | "hospital" | "from" | "to">;

interface DoctorFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  initial: DoctorFilters;
  onApply: (filters: DoctorFilters) => void;
}

/** Mount with a fresh `key` each time it opens so the draft starts from the applied filters. */
export function DoctorFiltersSheet({ open, onClose, initial, onApply }: DoctorFiltersSheetProps) {
  const { data: facets } = useDoctorFacets();
  const [specialization, setSpecialization] = useState<Specialization[]>(initial.specialization);
  const [hospital, setHospital] = useState<string | undefined>(initial.hospital);
  const [joined, setJoined] = useState<DateRange>({ from: initial.from, to: initial.to });

  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      description="Narrow down the doctor directory."
      onReset={() => {
        setSpecialization([]);
        setHospital(undefined);
        setJoined({});
      }}
      onApply={() => onApply({ specialization, hospital, from: joined.from, to: joined.to })}
    >
      <ToggleGroup
        label="Specialization"
        options={SPECIALIZATIONS.map((s) => ({ value: s, label: s }))}
        value={specialization}
        onChange={setSpecialization}
      />

      {facets ? (
        <ToggleGroup
          single
          label="Hospital"
          options={facets.hospitals.map((h) => ({ value: h, label: h }))}
          value={hospital ? [hospital] : []}
          onChange={(value) => setHospital(value[0])}
        />
      ) : (
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      <DateRangeFilter label="Joined" value={joined} onChange={setJoined} />
    </FilterSheet>
  );
}
