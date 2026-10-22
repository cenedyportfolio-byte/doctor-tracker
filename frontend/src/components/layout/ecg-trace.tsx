import { cn } from "@/lib/utils";

interface EcgTraceProps {
  id: string;
  className?: string;
}

export function EcgTrace({ id, className }: EcgTraceProps) {
  return (
    <svg
      className={cn("pointer-events-none block h-16 w-full", className)}
      style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width="240" height="64" patternUnits="userSpaceOnUse">
          <path
            d="M0 36 H52 Q59 26 66 36 H76 L80 41 L86 8 L92 48 L97 36 H114 Q126 22 138 36 H240"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
