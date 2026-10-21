import { cn, hashString, initials } from "@/lib/utils";

const TINTS = [
  "bg-[#e0f2fe] text-[#0c4a6e]",
  "bg-[#dcfce7] text-[#14532d]",
  "bg-[#fef3c7] text-[#78350f]",
  "bg-[#ede9fe] text-[#4c1d95]",
  "bg-[#fce7f3] text-[#831843]",
  "bg-[#ccfbf1] text-[#134e4a]",
] as const;

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-16 text-lg",
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const tint = TINTS[hashString(name) % TINTS.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide",
        SIZES[size],
        tint,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
