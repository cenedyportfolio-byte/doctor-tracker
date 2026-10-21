"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleGroupProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T[];
  onChange: (value: T[]) => void;
  /** Single choice: selecting an option replaces the selection, selecting it again clears it. */
  single?: boolean;
}

/** Pill-style multi (or single) select, used inside filter panels. */
export function ToggleGroup<T extends string>({ label, options, value, onChange, single }: ToggleGroupProps<T>) {
  const toggle = (option: T) => {
    const selected = value.includes(option);
    if (single) onChange(selected ? [] : [option]);
    else onChange(selected ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={selected}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                selected
                  ? "border-primary bg-primary-soft text-primary-soft-foreground"
                  : "border-border-strong text-muted hover:border-subtle hover:text-foreground",
              )}
            >
              {selected && <Check className="size-3.5" aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
