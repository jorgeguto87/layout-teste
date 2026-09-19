import { primaryAction, STATUS_TONE } from "@/lib/orders/format";
import { useOrders } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { cn } from "@/lib/utils";
import { CourierPicker } from "./CourierPicker";

/** Botão de ação principal do estágio atual — mesmo comportamento no card, na lista e no modal. */
export function PrimaryActionButton({
  order,
  size = "md",
  className,
}: {
  order: Order;
  size?: "md" | "lg";
  className?: string;
}) {
  const { startPrep, markReady, finish } = useOrders();
  const action = primaryAction(order);
  if (!action) return null;

  const tone = STATUS_TONE[order.status];
  const base = cn(
    "inline-flex items-center justify-center rounded-md font-semibold text-brand-foreground transition-[transform,background-color] active:scale-[0.98] whitespace-nowrap",
    size === "lg" ? "h-10 px-4 text-sm" : "h-9 px-3 text-sm",
    tone.solid,
    className,
  );

  if (action.kind === "assign_courier") {
    return (
      <CourierPicker orderId={order.id}>
        <button type="button" className={base} onClick={(e) => e.stopPropagation()}>
          {action.label}
        </button>
      </CourierPicker>
    );
  }

  const run = () => {
    if (action.kind === "start_prep") startPrep(order.id);
    else if (action.kind === "mark_ready") markReady(order.id);
    else finish(order.id);
  };

  return (
    <button
      type="button"
      className={base}
      onClick={(e) => {
        e.stopPropagation();
        run();
      }}
    >
      {action.label}
    </button>
  );
}
