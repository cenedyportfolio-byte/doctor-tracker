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

function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: ({ signal }) => api<DataResponse<{ user: SessionUser }>>("/auth/me", { signal }),
    select: (response) => response.data.user,
    staleTime: Infinity,
  });
}

export function useCurrentUser(): SessionUser | undefined {
  const { data } = useSession();
  return useHydrated() ? data : undefined;
}

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
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    },
  });
}
