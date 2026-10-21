import type { Condition, Gender, Specialization } from "@/lib/constants";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string | null;
  diagnosis: string;
  condition: Condition;
  admissionDate: string;
  notes: string | null;
  doctor: { id: string; name: string; specialization: Specialization } | null;
  createdAt: string;
  updatedAt: string;
}

export type PatientSort = "newest" | "oldest" | "name_asc" | "name_desc";

export interface PatientListParams {
  page: number;
  limit: number;
  search?: string;
  condition: Condition[];
  gender?: Gender;
  doctor?: string;
  minAge?: number;
  maxAge?: number;
  from?: string;
  to?: string;
  sort: PatientSort;
}

export interface PatientInput {
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  /** Empty string clears the field on update. */
  email: string;
  diagnosis: string;
  condition: Condition;
  admissionDate: string;
  notes: string;
  doctor: string;
}
