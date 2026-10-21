"use client";

import { subDays, subMonths } from "date-fns";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, toDateInputValue } from "@/lib/utils";

export interface DateRange {
  from?: string;
  to?: string;
}

const PRESETS = [
  { id: "7d", label: "Last 7 days", from: () => subDays(new Date(), 6) },
  { id: "30d", label: "Last 30 days", from: () => subDays(new Date(), 29) },
  { id: "90d", label: "Last 90 days", from: () => subDays(new Date(), 89) },
  { id: "12m", label: "Last 12 months", from: () => subMonths(new Date(), 12) },
] as const;

function presetRange(preset: (typeof PRESETS)[number]): DateRange {
  return { from: toDateInputValue(preset.from()), to: undefined };
}

interface DateRangeFilterProps {
  label: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
}

/** Quick presets plus explicit from/to dates (inclusive, yyyy-MM-dd). */
export function DateRangeFilter({ label, value, onChange }: DateRangeFilterProps) {
  const id = useId();
  const activePreset = PRESETS.find((p) => !value.to && value.from === presetRange(p).from)?.id;

  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-foreground">{label}</legend>
      <Select
        aria-label={`${label} preset`}
        className="mb-3"
        value={activePreset ?? (value.from || value.to ? "custom" : "")}
        onChange={(e) => {
          const preset = PRESETS.find((p) => p.id === e.target.value);
          if (preset) onChange(presetRange(preset));
          else if (e.target.value === "") onChange({});
        }}
      >
        <option value="">Any time</option>
        {PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
        <option value="custom" disabled>
          Custom range
        </option>
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted" htmlFor={`${id}-from`}>
          From
          <Input
            id={`${id}-from`}
            type="date"
            value={value.from ?? ""}
            max={value.to || toDateInputValue()}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted" htmlFor={`${id}-to`}>
          To
          <Input
            id={`${id}-to`}
            type="date"
            value={value.to ?? ""}
            min={value.from}
            max={toDateInputValue()}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          />
        </label>
      </div>
    </fieldset>
  );
}

export function describeDateRange({ from, to }: DateRange): string | undefined {
  if (from && to) return `${formatDate(from, "MMM d")} – ${formatDate(to, "MMM d, yyyy")}`;
  if (from) return `Since ${formatDate(from)}`;
  if (to) return `Until ${formatDate(to)}`;
  return undefined;
}
