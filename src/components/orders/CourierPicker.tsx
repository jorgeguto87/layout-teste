import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders } from "@/lib/orders/store";
import { COURIER_STATUS_LABEL } from "@/lib/orders/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const DOT: Record<string, string> = {
  disponivel: "bg-status-pronto",
  em_rota: "bg-status-rota",
  inativo: "bg-status-finalizado",
};

/** Lista de entregadores em popover; ao escolher, atribui o pedido. */
export function CourierPicker({
  orderId,
  currentCourierId,
  children,
}: {
  orderId: string;
  currentCourierId?: string;
  children: ReactNode;
}) {
  const { couriers, orders, assignCourier } = useOrders();

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-1.5 bg-ink-2 border-hairline text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Entregadores
        </div>
        <ul className="space-y-0.5">
          {couriers.map((c) => {
            const load = orders.filter((o) => o.courierId === c.id && o.status === "em_rota").length;
            const disabled = c.status === "inativo" || c.id === currentCourierId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => assignCourier(orderId, c.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    disabled ? "opacity-45 cursor-not-allowed" : "hover:bg-surface-hover",
                  )}
                >
                  <i className={cn("size-2 rounded-full shrink-0", DOT[c.status])} />
                  <span className="flex-1 font-medium truncate">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.id === currentCourierId
                      ? "atual"
                      : `${COURIER_STATUS_LABEL[c.status]}${load ? ` · ${load}` : ""}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
