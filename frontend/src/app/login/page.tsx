import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-foreground">Doctor Tracker</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Sign in to continue.</p>
        {/* useSearchParams (for ?next=) needs a Suspense boundary to keep the page static. */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="mt-1 h-10 w-full rounded-md" />
    </div>
  );
}
