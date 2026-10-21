import { Activity, BarChart3, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const FEATURES = [
  { icon: Users, title: "Doctors & patients", text: "Every doctor and their patient list in one place." },
  { icon: BarChart3, title: "Live analytics", text: "Admissions, workloads and outcomes at a glance." },
  { icon: ShieldCheck, title: "Secure by default", text: "Role-based access with httpOnly sessions." },
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[#0b3b38] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(60rem 40rem at -10% -10%, rgb(45 212 191 / 0.35), transparent 60%), radial-gradient(40rem 30rem at 110% 110%, rgb(56 189 248 / 0.25), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <span className="text-[17px] font-bold tracking-tight">Doctor Tracker</span>
        </div>

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

        <p className="relative text-xs text-teal-50/50">Doctor Tracker · Internal use only</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Logo className="mb-10 lg:hidden" />
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
      <Skeleton className="mt-1 h-11 w-full rounded-xl" />
    </div>
  );
}
