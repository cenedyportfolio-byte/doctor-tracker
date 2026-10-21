import { AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger-soft-foreground">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">Couldn&apos;t load data</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Thin indeterminate bar shown while a list refetches in the background. */
export function ProgressBar({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
      aria-hidden="true"
    >
      <div className="h-full w-2/5 animate-progress rounded-full bg-primary" />
    </div>
  );
}
