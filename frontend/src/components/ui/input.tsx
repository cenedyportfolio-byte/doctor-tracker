import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const controlStyles = cn(
  "w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground transition-colors",
  "placeholder:text-subtle hover:border-subtle",
  "focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlStyles, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlStyles, "min-h-20 resize-y py-2.5", className)} {...props} />;
}
