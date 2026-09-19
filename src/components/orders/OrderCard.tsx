import { cn } from "@/lib/utils";
import {
  channelLabel,
  customerLabel,
  elapsedLabel,
  money,
  shortId,
  STAGE_LABEL,
  STATUS_TONE,
  timeHM,
} from "@/lib/orders/format";
import { useOrders } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { SoftTag, StatusBadge } from "./StatusBadge";

function CourierLine({ order }: { order: Order }) {
  const { couriers } = useOrders();
  if (!order.courierId) return null;
  const c = couriers.find((x) => x.id === order.courierId);
  return (
    <div className="mt-1 text-[11px] text-status-rota/90">
      Entregador: {c?.name.split(" ")[0]} · {order.deliveryStage ? STAGE_LABEL[order.deliveryStage] : ""}
    </div>
  );
}

/** Card do quadro (desktop). */
export function OrderCard({ order, onOpen }: { order: Order; onOpen: (o: Order) => void }) {
  const { now } = useOrders();
  const tone = STATUS_TONE[order.status];
  const isNew = order.status === "recebido";
  const late = now - order.createdAt > 25 * 60000 && order.status !== "em_rota";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(order)}
      className="relative rounded-lg bg-ink-2 ring-1 ring-hairline overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:ring-foreground/20 transition-[transform,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-rise"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
      {isNew && <span className={cn("absolute inset-y-0 left-1 w-px animate-kpulse", tone.bar)} />}
      <div className="p-3 pl-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-bold text-2xl leading-none tracking-tight">{shortId(order.id)}</span>
          <span
            className={cn(
              "text-[11px] font-semibold rounded px-1.5 py-0.5 tabular-nums",
              late ? "text-status-cancelado bg-status-cancelado/15" : cn(tone.text, tone.soft),
            )}
          >
            {elapsedLabel(order.createdAt, now)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-secondary-foreground">
          <span className="font-medium">{channelLabel(order)}</span>
          {order.status === "pago" && <SoftTag tone="pago">Pago</SoftTag>}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {customerLabel(order)}
          {order.customerName && order.customerPhone ? ` · ${order.customerPhone}` : ""} · {timeHM(order.createdAt)}
        </div>
        <div className="mt-1 font-display font-semibold tabular-nums">{money(order.total)}</div>
        <CourierLine order={order} />
        <PrimaryActionButton order={order} className="mt-2.5 w-full" />
      </div>
    </article>
  );
}

/** Linha da lista (celular / histórico). */
export function OrderRow({
  order,
  onOpen,
  showStatus = true,
  showAction = true,
}: {
  order: Order;
  onOpen: (o: Order) => void;
  showStatus?: boolean;
  showAction?: boolean;
}) {
  const { now } = useOrders();
  const tone = STATUS_TONE[order.status];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(order)}
      className="relative flex items-center gap-3 rounded-lg bg-ink-2 ring-1 ring-hairline pl-4 pr-3 py-3 cursor-pointer overflow-hidden hover:bg-panel/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-lg leading-none tracking-tight">{shortId(order.id)}</span>
          <span className="text-xs font-medium text-secondary-foreground">{channelLabel(order)}</span>
          {showStatus && <StatusBadge status={order.status} />}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground truncate">
          {customerLabel(order)} · {timeHM(order.createdAt)} · {elapsedLabel(order.createdAt, now)}
        </div>
        <div className="mt-0.5 font-display font-semibold text-sm tabular-nums">{money(order.total)}</div>
      </div>
      {showAction && <PrimaryActionButton order={order} className="shrink-0 px-2.5 text-xs" />}
    </div>
  );
}
