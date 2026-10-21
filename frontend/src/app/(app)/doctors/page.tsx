import type { Metadata } from "next";
import { Suspense } from "react";
import { ListPageSkeleton } from "@/components/layout/page-skeletons";
import { DoctorsView } from "@/features/doctors/doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  // List state lives in the URL (useSearchParams), so the view renders behind a boundary.
  return (
    <Suspense fallback={<ListPageSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
