// Mirrors backend/src/config/constants.ts. Kept in sync by hand: the lists are small and
// stable, and duplicating them avoids a request before every form can render.

export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

export type Tone = "success" | "info" | "warning" | "danger" | "neutral";

export const CONDITIONS = ["stable", "under_observation", "critical", "recovering", "discharged"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_META: Record<
  Condition,
  { label: string; tone: Tone; description: string; chartColor: string }
> = {
  critical: {
    label: "Critical",
    tone: "danger",
    description: "Needs immediate attention",
    chartColor: "var(--status-critical)",
  },
  under_observation: {
    label: "Under observation",
    tone: "warning",
    description: "Being monitored",
    chartColor: "var(--status-warning)",
  },
  stable: {
    label: "Stable",
    tone: "success",
    description: "Vitals within normal range",
    chartColor: "var(--status-good)",
  },
  recovering: {
    label: "Recovering",
    tone: "info",
    description: "Improving after treatment",
    chartColor: "var(--chart-1)",
  },
  discharged: {
    label: "Discharged",
    tone: "neutral",
    description: "Treatment completed",
    chartColor: "var(--status-neutral)",
  },
};

/** Severity order used for lists and charts (most urgent first). */
export const CONDITIONS_BY_SEVERITY: Condition[] = [
  "critical",
  "under_observation",
  "stable",
  "recovering",
  "discharged",
];

export const GENDERS = ["female", "male", "other"] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABEL: Record<Gender, string> = { female: "Female", male: "Male", other: "Other" };

export const PAGE_SIZES = [10, 20, 50] as const;

export const DOCTOR_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

export const PATIENT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

export const STATS_RANGES = [
  { value: "7d", label: "7D", description: "last 7 days" },
  { value: "30d", label: "30D", description: "last 30 days" },
  { value: "90d", label: "90D", description: "last 90 days" },
] as const;
export type StatsRange = (typeof STATS_RANGES)[number]["value"];
