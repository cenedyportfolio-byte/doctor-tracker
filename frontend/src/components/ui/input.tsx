import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const controlStyles = cn(
  "w-full rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground shadow-xs transition-colors",
  "placeholder:text-subtle hover:border-subtle/70",
  "focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlStyles, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlStyles, "min-h-20 resize-y py-2.5", className)} {...props} />;
}
