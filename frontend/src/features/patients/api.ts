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
import { dayEndIso, dayStartIso, toDateInputValue } from "@/lib/utils";
import type { DataResponse, Paginated } from "@/types/api";
import type { Patient, PatientInput, PatientListParams } from "./types";

interface ListScope {
  /** Lists a single doctor's patients via GET /doctors/:id/patients. */
  doctorId?: string;
}

function patientListQuery(params: PatientListParams, scope: ListScope) {
  const path = scope.doctorId ? `/doctors/${scope.doctorId}/patients` : "/patients";
  return queryOptions({
    queryKey: patientKeys.list({ ...params, scope: scope.doctorId ?? "all" }),
    queryFn: ({ signal }) =>
      api<Paginated<Patient>>(path, {
        signal,
        query: { ...params, from: dayStartIso(params.from), to: dayEndIso(params.to) },
      }),
  });
}

export function usePatients(params: PatientListParams, scope: ListScope = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({ ...patientListQuery(params, scope), placeholderData: keepPreviousData });

  const hasNextPage = query.data?.meta.hasNextPage ?? false;
  const { doctorId } = scope;
  useEffect(() => {
    if (hasNextPage) {
      void queryClient.prefetchQuery(patientListQuery({ ...params, page: params.page + 1 }, { doctorId }));
    }
  }, [hasNextPage, params, doctorId, queryClient]);

  return query;
}

/** Every view a patient write can change: lists, doctor counts/profiles, and the dashboard. */
function useInvalidatePatientData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: patientKeys.all }),
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: doctorKeys.details() }),
      queryClient.invalidateQueries({ queryKey: statsKeys.all }),
    ]);
}

/** The form edits a calendar day; a same-day admission keeps the current time so ordering stays exact. */
function admissionTimestamp(day: string | undefined): string | undefined {
  if (!day) return undefined;
  return day === toDateInputValue() ? new Date().toISOString() : dayStartIso(day);
}

function toBody(input: Partial<PatientInput>) {
  return { ...input, admissionDate: admissionTimestamp(input.admissionDate) };
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ doctor, ...input }: PatientInput) =>
      // Created through the nested resource, so the doctor comes from the URL.
      api<DataResponse<Patient>>(`/doctors/${doctor}/patients`, { method: "POST", body: toBody(input) }).then(
        (r) => r.data,
      ),
    onSuccess: invalidate,
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PatientInput> }) =>
      api<DataResponse<Patient>>(`/patients/${id}`, { method: "PATCH", body: toBody(input) }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId?: string }) =>
      api<void>(doctorId ? `/doctors/${doctorId}/patients/${id}` : `/patients/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
