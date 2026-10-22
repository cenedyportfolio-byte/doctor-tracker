import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export function LogoMark({ className, inverted = false }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-white",
        inverted ? "bg-white/15 ring-1 ring-white/25" : "bg-linear-to-br from-teal-500 to-teal-700",
        className,
      )}
      aria-hidden="true"
    >
      <HeartPulse className="size-4" strokeWidth={2.2} />
    </span>
  );
}

export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark inverted={inverted} />
      <span className={cn("text-[15px] font-bold tracking-tight", inverted ? "text-white" : "text-foreground")}>
        Doctor Tracker
      </span>
    </span>
  );
}
