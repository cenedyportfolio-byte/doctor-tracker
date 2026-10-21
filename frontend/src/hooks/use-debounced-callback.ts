"use client";

import { useEffect, useMemo, useRef } from "react";

/** Returns a stable, debounced version of `callback` that always calls its latest version. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay: number) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return useMemo(() => {
    const debounced = (...args: Args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timeoutRef.current);
    return debounced;
  }, [delay]);
}
