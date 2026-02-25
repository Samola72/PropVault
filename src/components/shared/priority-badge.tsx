import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn, getPriorityColor } from "@/lib/utils";

const icons = { CRITICAL: AlertTriangle, HIGH: ArrowUp, MEDIUM: Minus, LOW: ArrowDown };

export function PriorityBadge({ priority }: { priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" }) {
  const Icon = icons[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", getPriorityColor(priority))}>
      <Icon className="w-3 h-3" />
      {priority}
    </span>
  );
}
