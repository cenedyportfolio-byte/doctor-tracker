import { useId } from "react";

interface ToggleGroupProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T[];
  onChange: (value: T[]) => void;
  /** Single choice (radios, with an "Any" option) instead of multiple checkboxes. */
  single?: boolean;
}

/** A labelled group of native checkboxes (or radios) for filter panels. */
export function ToggleGroup<T extends string>({ label, options, value, onChange, single }: ToggleGroupProps<T>) {
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {single && (
          <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-foreground">
            <input
              type="radio"
              name={name}
              checked={value.length === 0}
              onChange={() => onChange([])}
              className="size-4 accent-foreground"
            />
            Any
          </label>
        )}
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-foreground">
              <input
                type={single ? "radio" : "checkbox"}
                name={name}
                checked={selected}
                onChange={() => {
                  if (single) onChange([option.value]);
                  else onChange(selected ? value.filter((v) => v !== option.value) : [...value, option.value]);
                }}
                className="size-4 accent-foreground"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
