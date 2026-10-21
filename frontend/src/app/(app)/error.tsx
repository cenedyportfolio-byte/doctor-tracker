"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger-soft-foreground">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-md text-sm text-muted">
        An unexpected error occurred while showing this page.{digest ? ` (ref: ${digest})` : ""}
      </p>
      <Button variant="secondary" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </Card>
  );
}
