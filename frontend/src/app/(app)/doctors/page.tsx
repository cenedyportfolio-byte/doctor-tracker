import type { Metadata } from "next";
import { Suspense } from "react";
import { ListPageSkeleton } from "@/components/layout/page-skeletons";
import { DoctorsView } from "@/features/doctors/doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
