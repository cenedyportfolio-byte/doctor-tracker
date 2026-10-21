import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Lists and stats are fine to show from cache for a short while; mutations
        // invalidate the affected keys explicitly, so this only limits background refetches.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // Client errors (validation, auth, not found) won't succeed on retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
