import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const numberFormat = new Intl.NumberFormat("en-US");
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCompact(value: number): string {
  return value < 10_000 ? numberFormat.format(value) : compactFormat.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDate(value: string | Date, pattern = "MMM d, yyyy"): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  return date ? `${formatDistanceToNowStrict(date)} ago` : "—";
}

/** yyyy-MM-dd in local time, for <input type="date"> and API date filters. */
export function toDateInputValue(value: string | Date = new Date()): string {
  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}



export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Start of a local calendar day (yyyy-MM-dd) as an ISO timestamp, for API date filters. */
export function dayStartIso(day: string | undefined): string | undefined {
  if (!day) return undefined;
  const date = parseISO(day);
  return isValid(date) ? date.toISOString() : undefined;
}

/** End of a local calendar day (yyyy-MM-dd) as an ISO timestamp, for API date filters. */
export function dayEndIso(day: string | undefined): string | undefined {
  if (!day) return undefined;
  const date = parseISO(day);
  if (!isValid(date)) return undefined;
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}
