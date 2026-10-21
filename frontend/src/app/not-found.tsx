import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Compass className="size-7" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
        Go to dashboard
      </Link>
    </main>
  );
}
