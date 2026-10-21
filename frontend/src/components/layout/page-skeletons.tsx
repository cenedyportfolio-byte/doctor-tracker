import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table";

/** Route-level fallback for the list pages: header, toolbar and table placeholders. */
export function ListPageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Card className="overflow-hidden">
        <div className="flex gap-2 p-3 sm:px-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="hidden h-9 w-40 sm:block" />
        </div>
        <TableSkeleton label="Loading list" />
      </Card>
    </div>
  );
}
