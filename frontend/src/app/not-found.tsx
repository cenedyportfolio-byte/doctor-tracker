import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted">404</p>
      <h1 className="mt-1 text-xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/dashboard" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
        Go to dashboard
      </Link>
    </main>
  );
}
