import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <Activity className="size-5" strokeWidth={2.4} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-bold tracking-tight text-foreground">
        Doctor<span className="text-primary">Tracker</span>
      </span>
    </span>
  );
}
