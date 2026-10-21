import { useState } from "react";
import { DateRangeFilter, type DateRange } from "@/components/filters/date-range-filter";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { ToggleGroup } from "@/components/filters/toggle-group";
import { Input } from "@/components/ui/input";
import { DoctorPicker, type PickedDoctor } from "@/features/doctors/doctor-picker";
import {
  CONDITION_META,
  CONDITIONS_BY_SEVERITY,
  GENDER_LABEL,
  GENDERS,
  type Condition,
  type Gender,
} from "@/lib/constants";
import type { PatientListParams } from "./types";

type PatientFilters = Pick<PatientListParams, "condition" | "gender" | "doctor" | "minAge" | "maxAge" | "from" | "to">;

interface PatientFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  initial: PatientFilters;
  initialDoctor: PickedDoctor | null;
  /** Hide the doctor filter when the list is already scoped to one doctor. */
  showDoctor: boolean;
  onApply: (filters: PatientFilters) => void;
}

function parseAge(value: string): number | undefined {
  if (value === "") return undefined;
  const age = Number.parseInt(value, 10);
  return Number.isFinite(age) ? Math.min(Math.max(age, 0), 120) : undefined;
}

/** Mount with a fresh `key` each time it opens so the draft starts from the applied filters. */
export function PatientFiltersSheet({
  open,
  onClose,
  initial,
  initialDoctor,
  showDoctor,
  onApply,
}: PatientFiltersSheetProps) {
  const [condition, setCondition] = useState<Condition[]>(initial.condition);
  const [gender, setGender] = useState<Gender | undefined>(initial.gender);
  const [doctor, setDoctor] = useState<PickedDoctor | null>(initialDoctor);
  const [minAge, setMinAge] = useState(initial.minAge?.toString() ?? "");
  const [maxAge, setMaxAge] = useState(initial.maxAge?.toString() ?? "");
  const [admitted, setAdmitted] = useState<DateRange>({ from: initial.from, to: initial.to });

  const apply = () => {
    let min = parseAge(minAge);
    let max = parseAge(maxAge);
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
    onApply({
      condition,
      gender,
      doctor: showDoctor ? doctor?.id : undefined,
      minAge: min,
      maxAge: max,
      from: admitted.from,
      to: admitted.to,
    });
  };

  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      description="Find patients by condition, doctor, age and admission date."
      onApply={apply}
      onReset={() => {
        setCondition([]);
        setGender(undefined);
        setDoctor(null);
        setMinAge("");
        setMaxAge("");
        setAdmitted({});
      }}
    >
      <ToggleGroup
        label="Condition"
        options={CONDITIONS_BY_SEVERITY.map((c) => ({ value: c, label: CONDITION_META[c].label }))}
        value={condition}
        onChange={setCondition}
      />

      {showDoctor && (
        <div>
          <label htmlFor="filter-doctor" className="mb-2 block text-[13px] font-semibold text-foreground">
            Doctor
          </label>
          <DoctorPicker id="filter-doctor" value={doctor} onChange={setDoctor} placeholder="Any doctor" clearable />
        </div>
      )}

      <ToggleGroup
        single
        label="Gender"
        options={GENDERS.map((g) => ({ value: g, label: GENDER_LABEL[g] }))}
        value={gender ? [gender] : []}
        onChange={(value) => setGender(value[0])}
      />

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-foreground">Age</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Min
            <Input type="number" inputMode="numeric" min={0} max={120} placeholder="0" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Max
            <Input type="number" inputMode="numeric" min={0} max={120} placeholder="120" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <DateRangeFilter label="Admitted" value={admitted} onChange={setAdmitted} />
    </FilterSheet>
  );
}
