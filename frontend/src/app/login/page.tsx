import { Activity, ShieldPlus, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandBackdrop } from "@/components/layout/brand-backdrop";
import { EcgTrace } from "@/components/layout/ecg-trace";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const FEATURES = [
  { icon: Stethoscope, title: "Doctors & patients", text: "Every doctor and their patient list in one place." },
  { icon: Activity, title: "Live analytics", text: "Admissions, patient load and conditions at a glance." },
  { icon: ShieldPlus, title: "Secure by default", text: "Role-based access with httpOnly sessions." },
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-brand-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandBackdrop />
        <EcgTrace id="login-ecg" className="absolute inset-x-0 bottom-24 text-teal-300/35" />

        <Link href="/" className="relative w-fit rounded-lg">
          <Logo inverted />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-bold tracking-tight text-balance">
            Care teams, patients and outcomes. One clear view.
          </h2>
          <p className="mt-4 text-base text-teal-50/80">
            The admin portal for keeping track of doctors, their patients, and how your hospitals are doing.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5 text-teal-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-teal-50/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-teal-50/60">Doctor Tracker · Internal use only</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-10 inline-flex rounded-lg lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted">Sign in to the admin portal to continue.</p>
          {/* useSearchParams (for ?next=) needs a Suspense boundary to keep the page static. */}
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="mt-1 h-11 w-full rounded-lg" />
    </div>
  );
}
