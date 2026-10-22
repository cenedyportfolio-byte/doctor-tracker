import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { doctorKeys, patientKeys, statsKeys } from "@/lib/query-keys";
import { dayEndIso, dayStartIso } from "@/lib/utils";
import type { DataResponse, Paginated } from "@/types/api";
import type {
  Doctor,
  DoctorDetail,
  DoctorFacets,
  DoctorInput,
  DoctorListParams,
  DoctorOption,
} from "./types";

function doctorListQuery(params: DoctorListParams) {
  return queryOptions({
    queryKey: doctorKeys.list(params),
    queryFn: ({ signal }) =>
      api<Paginated<Doctor>>("/doctors", {
        signal,
        query: { ...params, from: dayStartIso(params.from), to: dayEndIso(params.to) },
      }),
  });
}

export function useDoctors(params: DoctorListParams) {
  const queryClient = useQueryClient();
  const query = useQuery({
    ...doctorListQuery(params),
    placeholderData: keepPreviousData,
  });

  const hasNextPage = query.data?.meta.hasNextPage ?? false;
  useEffect(() => {
    if (hasNextPage) void queryClient.prefetchQuery(doctorListQuery({ ...params, page: params.page + 1 }));
  }, [hasNextPage, params, queryClient]);

  return query;
}

export function doctorDetailQuery(id: string) {
  return queryOptions({
    queryKey: doctorKeys.detail(id),
    queryFn: ({ signal }) => api<DataResponse<DoctorDetail>>(`/doctors/${id}`, { signal }),
    select: (response) => response.data,
  });
}

export function useDoctor(id: string) {
  return useQuery(doctorDetailQuery(id));
}

export function useDoctorFacets() {
  return useQuery({
    queryKey: doctorKeys.facets(),
    queryFn: ({ signal }) => api<DataResponse<DoctorFacets>>("/doctors/facets", { signal }),
    select: (response) => response.data,
    staleTime: 5 * 60_000,
  });
}

export function useDoctorOptions(search: string, enabled = true) {
  return useQuery({
    queryKey: doctorKeys.options(search),
    queryFn: ({ signal }) =>
      api<DataResponse<DoctorOption[]>>("/doctors/options", { signal, query: { search, limit: 20 } }),
    select: (response) => response.data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });
}

function useInvalidateDoctorData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: doctorKeys.facets() }),
      queryClient.invalidateQueries({ queryKey: [...doctorKeys.all, "options"] }),
      queryClient.invalidateQueries({ queryKey: statsKeys.all }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (input: DoctorInput) =>
      api<DataResponse<Doctor>>("/doctors", { method: "POST", body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (input: Partial<DoctorInput>) =>
      api<DataResponse<Doctor>>(`/doctors/${id}`, { method: "PATCH", body: input }).then((r) => r.data),
    onSuccess: async (doctor) => {
      queryClient.setQueryData<DataResponse<DoctorDetail>>(doctorKeys.detail(id), (old) =>
        old ? { data: { ...old.data, ...doctor } } : old,
      );
      await Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: patientKeys.lists() })]);
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/doctors/${id}`, { method: "DELETE" }),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: doctorKeys.detail(id), refetchType: "none" });
      await invalidate();
    },
  });
}
