import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetailSkeleton, DoctorDetailView } from "@/features/doctors/doctor-detail-view";

export const metadata: Metadata = { title: "Doctor profile" };

export default function DoctorPage({ params }: PageProps<"/doctors/[id]">) {
  return (
    <Suspense fallback={<DoctorDetailSkeleton />}>
      {params.then(({ id }) => (
        <DoctorDetailView id={id} />
      ))}
    </Suspense>
  );
}
