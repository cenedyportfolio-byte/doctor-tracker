import type { Condition, Specialization } from "@/lib/constants";

export interface Doctor {
  id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorDetail extends Doctor {
  patientsByCondition: Record<Condition, number>;
  lastAdmissionAt: string | null;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialization: Specialization;
  hospital: string;
}

export interface DoctorFacets {
  specializations: Specialization[];
  hospitals: string[];
}

export type DoctorSort = "newest" | "oldest" | "name_asc" | "name_desc";

export interface DoctorListParams {
  page: number;
  limit: number;
  search?: string;
  specialization: Specialization[];
  hospital?: string;
  from?: string;
  to?: string;
  sort: DoctorSort;
}

export interface DoctorInput {
  name: string;
  specialization: Specialization;
  hospital: string;
  phone: string;
  email: string;
}
