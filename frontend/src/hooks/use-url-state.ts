import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toSearchParams, type QueryParams } from "@/lib/api-client";

/**
 * Reads and writes list state (page, filters, sort) in the URL query string.
 *
 * The URL is the single source of truth for list state: it is shareable, survives reloads,
 * and needs no global store. Updates go through `history.replaceState`, which Next.js syncs
 * into `useSearchParams` without a server round trip or a new history entry per keystroke.
 */
export function useUrlState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const update = useCallback(
    (patch: QueryParams, options: { resetPage?: boolean } = {}) => {
      const { resetPage = true } = options;
      const next = new URLSearchParams(searchParams.toString());

      const patchParams = toSearchParams(patch);
      for (const key of Object.keys(patch)) {
        const value = patchParams.get(key);
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (resetPage && !("page" in patch)) next.delete("page");

      const query = next.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [pathname, searchParams],
  );

  const reset = useCallback(
    (keep: string[] = []) => {
      const next = new URLSearchParams();
      for (const key of keep) {
        const value = searchParams.get(key);
        if (value) next.set(key, value);
      }
      const query = next.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [pathname, searchParams],
  );

  return { searchParams, update, reset };
}

export function readString(params: URLSearchParams, key: string): string | undefined {
  return params.get(key)?.trim() || undefined;
}

export function readList<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw.split(",").filter((v): v is T => (allowed as readonly string[]).includes(v));
}

export function readInt(params: URLSearchParams, key: string, fallback: number, max = Infinity): number {
  const value = Number.parseInt(params.get(key) ?? "", 10);
  return Number.isFinite(value) && value >= 1 ? Math.min(value, max) : fallback;
}

export function readEnum<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const value = params.get(key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
