import { AlertTriangle, CheckCircle2, Eye, LogOut, TrendingUp, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONDITION_META, type Condition } from "@/lib/constants";

// Status is never conveyed by color alone: every condition also has an icon and a label.
export const CONDITION_ICONS: Record<Condition, LucideIcon> = {
  critical: AlertTriangle,
  under_observation: Eye,
  stable: CheckCircle2,
  recovering: TrendingUp,
  discharged: LogOut,
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  const meta = CONDITION_META[condition];
  const Icon = CONDITION_ICONS[condition];
  return (
    <Badge tone={meta.tone}>
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
