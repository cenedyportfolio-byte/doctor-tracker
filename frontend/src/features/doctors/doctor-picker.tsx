"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { controlStyles } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { useDoctorOptions } from "./api";
import type { DoctorOption } from "./types";

export type PickedDoctor = Pick<DoctorOption, "id" | "name"> & Partial<DoctorOption>;

interface DoctorPickerProps {
  id: string;
  value: PickedDoctor | null;
  onChange: (doctor: PickedDoctor | null) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  clearable?: boolean;
}

/**
 * Searchable doctor combobox (WAI-ARIA combobox pattern). Options come from a server-side
 * prefix search, so it stays fast however many doctors exist.
 */
export function DoctorPicker({
  id,
  value,
  onChange,
  placeholder = "Search doctors…",
  invalid,
  describedBy,
  clearable = false,
}: DoctorPickerProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const updateSearch = useDebouncedCallback((next: string) => setSearch(next.trim()), 200);

  const { data: options = [], isFetching } = useDoctorOptions(search, open);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // The list is shown as a popover (top layer), so a dialog's scroll area can't clip it.
  // It is positioned against the input and flips upwards when there's no room below.
  useLayoutEffect(() => {
    const list = listRef.current;
    const anchor = inputRef.current;
    if (!open || !list || !anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      const openUp = below < 272 && rect.top > below;
      list.style.left = `${rect.left}px`;
      list.style.width = `${rect.width}px`;
      list.style.top = openUp ? "auto" : `${rect.bottom + 6}px`;
      list.style.bottom = openUp ? `${window.innerHeight - rect.top + 6}px` : "auto";
    };

    place();
    list.showPopover();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      if (list.matches(":popover-open")) list.hidePopover();
    };
  }, [open]);

  const openList = () => {
    setOpen(true);
    setActiveIndex(0);
  };

  const select = (option: DoctorOption) => {
    onChange(option);
    setOpen(false);
    setInput("");
    setSearch("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) select(option);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation(); // don't close a surrounding dialog
      setOpen(false);
    }
  };

  const activeOptionId = open && options[activeIndex] ? `${listboxId}-${options[activeIndex].id}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        value={open ? input : (value?.name ?? "")}
        placeholder={open && value ? value.name : placeholder}
        onFocus={openList}
        onClick={() => !open && openList()}
        onChange={(event) => {
          setInput(event.target.value);
          updateSearch(event.target.value);
          setActiveIndex(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={cn(controlStyles, "h-10 pr-16")}
      />
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-subtle">
        {isFetching && open && <Spinner className="size-3.5" />}
        {clearable && value && !open ? (
          <button
            type="button"
            className="pointer-events-auto flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-surface-3 hover:text-foreground"
            onClick={() => onChange(null)}
            aria-label="Clear doctor"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <ChevronsUpDown className="size-4" aria-hidden="true" />
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          popover="manual"
          role="listbox"
          aria-label="Doctors"
          className="fixed right-auto m-0 max-h-64 animate-fade-in overflow-y-auto rounded-xl border border-border bg-surface p-1 text-foreground shadow-overlay"
        >
          {options.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">
              {isFetching ? "Searching…" : "No doctors found"}
            </li>
          ) : (
            options.map((option, index) => {
              const selected = option.id === value?.id;
              return (
                <li
                  key={option.id}
                  id={`${listboxId}-${option.id}`}
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => select(option)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                    index === activeIndex && "bg-surface-3",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{option.name}</p>
                    <p className="truncate text-xs text-muted">
                      {option.specialization} · {option.hospital}
                    </p>
                  </div>
                  {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
