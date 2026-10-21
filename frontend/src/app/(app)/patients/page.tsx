import type { Metadata } from "next";
import { Suspense } from "react";
import { ListPageSkeleton } from "@/components/layout/page-skeletons";
import { PatientList } from "@/features/patients/patient-list";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <PatientList />
    </Suspense>
  );
}
