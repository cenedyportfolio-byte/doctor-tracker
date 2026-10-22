import {
  ArrowRight,
  BarChart3,
  Check,
  LockKeyhole,
  MonitorSmartphone,
  ShieldCheck,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dashboardShot from "@/assets/landing-dashboard.png";
import mobileShot from "@/assets/landing-mobile.png";
import { BrandBackdrop } from "@/components/layout/brand-backdrop";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Doctor Tracker" },
  description: "Secure administrative app for managing doctors and their patients, with analytics.",
};

// Each card describes a screen that exists in the app, in the terms the app uses.
const SCREENS = [
  {
    icon: Stethoscope,
    title: "Doctors",
    text: "A directory of every doctor, with the patients under their care one click away.",
    items: [
      "Specialization, hospital, phone and email for each doctor",
      "Search by name, email, hospital or phone; filter by specialization, hospital and join date",
      "Add patients under a doctor, or remove them from their list",
    ],
  },
  {
    icon: Users,
    title: "Patients",
    text: "Every patient record, searchable and filterable from one list.",
    items: [
      "Age, gender, diagnosis, condition and admission date",
      "Filter by condition, doctor, gender, age and admission date",
      "Edit details, reassign a patient to another doctor, or delete a record",
    ],
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    text: "The numbers that matter, charted from live data.",
    items: [
      "Totals for doctors, patients and critical patients",
      "Admissions per day over the last 7, 30 or 90 days",
      "Patients per doctor and patients by condition",
    ],
  },
] as const;

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Role-based access",
    text: "Admins add, edit and delete. Viewers get a read-only view, enforced by the API, not just hidden buttons.",
  },
  {
    icon: Zap,
    title: "Fast search and filters",
    text: "Search across thousands of records as you type. Every list query is backed by a database index.",
  },
  {
    icon: MonitorSmartphone,
    title: "Works on any screen",
    text: "A sidebar layout on desktop; a compact table and a slide-out menu on phones.",
  },
  {
    icon: LockKeyhole,
    title: "Secure sessions",
    text: "Sessions live in an httpOnly cookie that page scripts can't read, checked before any page renders.",
  },
] as const;

const lightButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-teal-50";
const outlineButton =
  "inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10";

/** Public landing page. Signed-in users are redirected to the dashboard by `src/proxy.ts`. */
export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-background">
      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-lg">
          <Logo inverted />
        </Link>
        <nav aria-label="Landing" className="flex items-center gap-1 sm:gap-2">
          <a
            href="#features"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-teal-50/80 hover:text-white sm:block"
          >
            Features
          </a>
          <a
            href="#highlights"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-teal-50/80 hover:text-white sm:block"
          >
            Why it&apos;s solid
          </a>
          <Link
            href="/login"
            className="ml-2 inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-semibold text-brand-ink hover:bg-teal-50"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden bg-brand-ink pt-16 text-white">
          <BrandBackdrop />
          {/* The lower part of the product preview sits on the page background. */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-background md:h-44" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-14 text-center sm:px-6 sm:pt-20 sm:pb-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-100 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-teal-300" aria-hidden="true" />
              Admin portal for hospital staff
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-6xl">
              Care teams, patients and outcomes. One clear view.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-pretty text-teal-50/80 sm:text-lg">
              Doctor Tracker is a secure administrative app for managing doctors and the patients under their care, with
              a dashboard that charts admissions, patient load per doctor and patient conditions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className={lightButton}>
                Sign in
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href="#features" className={outlineButton}>
                See what&apos;s inside
              </a>
            </div>
            <p className="mt-4 text-xs text-teal-50/70">Demo admin and viewer accounts are on the sign-in page.</p>
          </div>

          {/* Product preview: the desktop dashboard with a phone beside it; phones see the phone view only. */}
          <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-6 md:pb-16">
            <div className="relative hidden md:block">
              <figure className="relative overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-black/10">
                <div
                  className="flex h-8 items-center gap-1.5 border-b border-border bg-surface-2 px-3"
                  aria-hidden="true"
                >
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                  <span className="mx-auto rounded-md bg-surface px-16 py-0.5 text-[11px] text-subtle ring-1 ring-border">
                    doctor-tracker / dashboard
                  </span>
                </div>
                <Image
                  src={dashboardShot}
                  alt="The dashboard: stat tiles, patients per doctor, admissions over time and patients by condition"
                  priority
                  placeholder="blur"
                  sizes="(min-width: 1152px) 1104px, 100vw"
                  className="h-auto w-full"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent"
                  aria-hidden="true"
                />
              </figure>
              <PhoneFrame className="absolute -right-2 -bottom-10 w-44 lg:-right-8 lg:w-52" />
            </div>
            <PhoneFrame className="mx-auto w-56 md:hidden" />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-14 pb-20 sm:px-6 md:pt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Everything in one place</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-foreground">
              Three screens, built for everyday admin work
            </h2>
            <p className="mt-3 text-base text-muted">
              Keep the doctor directory current, manage each patient record, and see how the hospitals are doing,
              without switching tools.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SCREENS.map(({ icon: Icon, title, text, items }) => (
              <article key={title} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{text}</p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="highlights" className="scroll-mt-6 border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Why it&apos;s solid</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-brand-ink px-6 py-14 text-center text-white sm:px-12">
            <BrandBackdrop />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">Take a look around</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-teal-50/80">
              Sign in with the demo admin account for full access, or the viewer account to see the read-only
              experience.
            </p>
            <Link href="/login" className={`${lightButton} relative mt-7`}>
              Sign in
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted">Next.js · Express · MongoDB</p>
        </div>
      </footer>
    </div>
  );
}

function PhoneFrame({ className }: { className?: string }) {
  return (
    <figure
      className={cn("overflow-hidden rounded-[1.6rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-2xl", className)}
    >
      <Image
        src={mobileShot}
        alt="The dashboard on a phone"
        placeholder="blur"
        sizes="224px"
        className="h-auto w-full rounded-[1.25rem]"
      />
    </figure>
  );
}
