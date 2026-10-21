"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { api } from "@/lib/api-client";
import type { DataResponse, SessionUser } from "@/types/api";

export interface LoginInput {
  email: string;
  password: string;
}

export const authKeys = {
  session: ["auth", "session"] as const,
};

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: ({ signal }) => api<DataResponse<{ user: SessionUser }>>("/auth/me", { signal }),
    select: (response) => response.data.user,
    // The session doesn't change during a visit; the API reports expiry with a 401.
    staleTime: Infinity,
  });
}

/**
 * The signed-in user for rendering. Withheld until hydration has finished: streamed sections
 * are server-rendered without a session, and the browser may already have fetched it by the
 * time they hydrate, which would make server and client markup differ.
 */
export function useCurrentUser(): SessionUser | undefined {
  const { data } = useSession();
  return useHydrated() ? data : undefined;
}

/** UI-level permission check. The API enforces the same rule on every request. */
export function useCanEdit(): boolean {
  return useCurrentUser()?.role === "admin";
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<DataResponse<{ user: SessionUser }>>("/auth/login", { method: "POST", body: input }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      queryClient.clear();
      // Full navigation (not router.push) so no cached authenticated UI survives in the router cache.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    },
  });
}
