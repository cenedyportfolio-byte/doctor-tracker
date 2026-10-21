"use client";

import { useMemo } from "react";
import { readEnum, readInt, readList, readString, useUrlState } from "@/hooks/use-url-state";
import { DOCTOR_SORTS, PAGE_SIZES, SPECIALIZATIONS } from "@/lib/constants";
import type { DoctorListParams, DoctorSort } from "./types";

const SORT_VALUES = DOCTOR_SORTS.map((s) => s.value);

/** Doctor list state, parsed from (and written to) the URL query string. */
export function useDoctorListParams() {
  const { searchParams, update, reset } = useUrlState();

  const params = useMemo<DoctorListParams>(() => {
    const limit = readInt(searchParams, "limit", PAGE_SIZES[0]);
    return {
      page: readInt(searchParams, "page", 1),
      limit: (PAGE_SIZES as readonly number[]).includes(limit) ? limit : PAGE_SIZES[0],
      search: readString(searchParams, "search"),
      specialization: readList(searchParams, "specialization", SPECIALIZATIONS),
      hospital: readString(searchParams, "hospital"),
      from: readString(searchParams, "from"),
      to: readString(searchParams, "to"),
      sort: readEnum<DoctorSort>(searchParams, "sort", SORT_VALUES, "newest"),
    };
  }, [searchParams]);

  return { params, update, reset };
}
