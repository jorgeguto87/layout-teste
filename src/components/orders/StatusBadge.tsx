import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orders/format";
import type { OrderStatus } from "@/lib/orders/types";

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  status: OrderStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full ring-1 whitespace-nowrap",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        tone.text,
        tone.soft,
        tone.ring,
        className,
      )}
    >
      <i className={cn("size-1.5 rounded-full", tone.bar)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SoftTag({ tone, children }: { tone: OrderStatus; children: React.ReactNode }) {
  const t = STATUS_TONE[tone];
  return (
    <span className={cn("text-[11px] font-semibold rounded px-1.5 py-0.5 whitespace-nowrap", t.text, t.soft)}>
      {children}
    </span>
  );
}
