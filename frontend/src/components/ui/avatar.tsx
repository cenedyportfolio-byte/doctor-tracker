import { cn, hashString, initials } from "@/lib/utils";

const TINTS = [
  "bg-[#e0f2fe] text-[#0c4a6e] dark:bg-[#0c4a6e]/50 dark:text-[#bae6fd]",
  "bg-[#dcfce7] text-[#14532d] dark:bg-[#14532d]/50 dark:text-[#bbf7d0]",
  "bg-[#fef3c7] text-[#78350f] dark:bg-[#78350f]/45 dark:text-[#fde68a]",
  "bg-[#ede9fe] text-[#4c1d95] dark:bg-[#4c1d95]/50 dark:text-[#ddd6fe]",
  "bg-[#fce7f3] text-[#831843] dark:bg-[#831843]/45 dark:text-[#fbcfe8]",
  "bg-[#ccfbf1] text-[#134e4a] dark:bg-[#134e4a]/55 dark:text-[#99f6e4]",
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
