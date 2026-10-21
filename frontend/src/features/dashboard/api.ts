"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Condition, Gender, Specialization, StatsRange } from "@/lib/constants";
import { statsKeys } from "@/lib/query-keys";
import type { DataResponse } from "@/types/api";

export interface Comparison {
  current: number;
  previous: number;
  changePct: number | null;
}

export interface Overview {
  range: StatsRange;
  granularity: "day" | "week" | "month";
  generatedAt: string;
  totals: { doctors: number; patients: number; critical: number; avgPatientsPerDoctor: number };
  period: { admissions: Comparison; newDoctors: Comparison };
  admissionsTrend: Array<{ bucket: string; admissions: number; critical: number }>;
  patientsByCondition: Array<{ condition: Condition; count: number }>;
  patientsByGender: Array<{ gender: Gender; count: number }>;
  ageGroups: Array<{ label: string; count: number }>;
  topDoctors: Array<{
    id: string;
    name: string;
    specialization: Specialization;
    hospital: string;
    patients: number;
    critical: number;
  }>;
  specializations: Array<{ specialization: Specialization; doctors: number; patients: number }>;
  recentPatients: Array<{
    id: string;
    name: string;
    condition: Condition;
    diagnosis: string;
    admissionDate: string;
    doctor: { id: string; name: string } | null;
  }>;
}

/** All dashboard data in one request; the API computes it with parallel aggregations. */
export function useOverview(range: StatsRange) {
  return useQuery({
    queryKey: statsKeys.overview(range),
    queryFn: ({ signal }) => api<DataResponse<Overview>>("/stats/overview", { signal, query: { range } }),
    select: (response) => response.data,
    // Switching ranges keeps the previous charts on screen until the new data arrives.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
