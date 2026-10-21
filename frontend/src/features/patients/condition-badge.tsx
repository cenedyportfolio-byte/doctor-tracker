import { CONDITION_META, type Condition } from "@/lib/constants";

export function ConditionBadge({ condition }: { condition: Condition }) {
  const meta = CONDITION_META[condition];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-foreground">
      <span className="size-2 shrink-0 rounded-full" style={{ background: meta.chartColor }} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
