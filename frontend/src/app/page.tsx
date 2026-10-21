import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Doctor Tracker" },
  description: "Admin tool for managing doctors, their patients and admissions.",
};

// Each section describes a screen that exists in the app, in the terms the app uses.
const SCREENS = [
  {
    title: "Doctors",
    items: [
      "Directory of doctors with their specialization, hospital, phone and email",
      "Search by name, email, hospital or phone; filter by specialization, hospital and join date",
      "Each doctor's profile lists their patients, where patients can be added or removed",
    ],
  },
  {
    title: "Patients",
    items: [
      "Every patient record with age, gender, diagnosis, condition and admission date",
      "Search by name, diagnosis, phone or email; filter by condition, doctor, gender, age and admission date",
      "Edit details, reassign a patient to another doctor, or delete a record",
    ],
  },
  {
    title: "Dashboard",
    items: [
      "Totals for doctors, patients and critical patients",
      "Admissions per day over the last 7, 30 or 90 days",
      "Patients per doctor and patients by condition",
    ],
  },
] as const;

/** Public landing page. Signed-in users are redirected to the dashboard by `src/proxy.ts`. */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold text-foreground">Doctor Tracker</span>
          <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Doctor Tracker</h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          An admin tool for hospital staff to keep track of doctors, the patients under their care, and
          admissions over time.
        </p>
        <Link href="/login" className={buttonVariants({ className: "mt-6" })}>
          Sign in
        </Link>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {SCREENS.map((screen) => (
            <section key={screen.title} className="bg-surface p-5">
              <h2 className="text-sm font-semibold text-foreground">{screen.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted marker:text-subtle">
                {screen.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground">Access</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Only signed-in staff accounts can use the app. Admins can add, edit and delete doctors and
            patients; viewer accounts are read-only.
          </p>
        </section>
      </main>
    </div>
  );
}
