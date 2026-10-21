"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { controlStyles } from "./input";

interface SearchInputProps {
  /** Initial value. Remount with a new `key` to reset it from outside. */
  defaultValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
  delay?: number;
  className?: string;
}

/**
 * Keeps keystrokes in local state and only reports the value after the user pauses typing,
 * so a fast typist triggers one request instead of one per character.
 */
export function SearchInput({
  defaultValue = "",
  onSearch,
  placeholder = "Search…",
  label = "Search",
  delay = 300,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedSearch = useDebouncedCallback((next: string) => onSearch(next.trim()), delay);

  const change = (next: string) => {
    setValue(next);
    debouncedSearch(next);
  };

  const clear = () => {
    setValue("");
    debouncedSearch.cancel();
    onSearch("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className={cn(controlStyles, "h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
