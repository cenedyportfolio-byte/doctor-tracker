import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 font-normal text-subtle">(optional)</span>
        )}
      </label>
      {children}
      {message && (
        <p
          id={fieldMessageId(htmlFor)}
          className={cn("text-xs", error ? "text-danger-soft-foreground" : "text-muted")}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function fieldMessageId(id: string) {
  return `${id}-message`;
}
