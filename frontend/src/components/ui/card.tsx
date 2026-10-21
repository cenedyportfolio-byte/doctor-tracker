import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-surface shadow-card", className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function CardHeader({ title, description, action, className, id }: CardHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-1", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-foreground">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
