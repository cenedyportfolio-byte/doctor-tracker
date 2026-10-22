import { useMemo } from "react";
import { readEnum, readInt, readList, readString, useUrlState } from "@/hooks/use-url-state";
import { CONDITIONS, GENDERS, PAGE_SIZES, PATIENT_SORTS, type Gender } from "@/lib/constants";
import type { PatientListParams, PatientSort } from "./types";

const SORT_VALUES = PATIENT_SORTS.map((s) => s.value);

function readAge(params: URLSearchParams, key: string): number | undefined {
  const value = Number.parseInt(params.get(key) ?? "", 10);
  return Number.isFinite(value) && value >= 0 && value <= 120 ? value : undefined;
}

export function usePatientListParams() {
  const { searchParams, update, reset } = useUrlState();

  const params = useMemo<PatientListParams>(() => {
    const limit = readInt(searchParams, "limit", PAGE_SIZES[0]);
    const gender = searchParams.get("gender");
    return {
      page: readInt(searchParams, "page", 1),
      limit: (PAGE_SIZES as readonly number[]).includes(limit) ? limit : PAGE_SIZES[0],
      search: readString(searchParams, "search"),
      condition: readList(searchParams, "condition", CONDITIONS),
      gender: gender && (GENDERS as readonly string[]).includes(gender) ? (gender as Gender) : undefined,
      doctor: readString(searchParams, "doctor"),
      minAge: readAge(searchParams, "minAge"),
      maxAge: readAge(searchParams, "maxAge"),
      from: readString(searchParams, "from"),
      to: readString(searchParams, "to"),
      sort: readEnum<PatientSort>(searchParams, "sort", SORT_VALUES, "newest"),
    };
  }, [searchParams]);

  return { params, update, reset };
}
