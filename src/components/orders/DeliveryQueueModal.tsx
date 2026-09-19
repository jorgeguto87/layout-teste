import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { channelLabel, COURIER_STATUS_LABEL, customerLabel, money, shortId, STAGE_LABEL } from "@/lib/orders/format";
import { useOrders } from "@/lib/orders/store";
import type { DeliveryStage } from "@/lib/orders/types";
import { cn } from "@/lib/utils";
import { Bike } from "lucide-react";

const STAGE_ORDER: DeliveryStage[] = ["no_local", "proxima", "na_fila", "entregue"];
const STAGE_TONE: Record<DeliveryStage, string> = {
  na_fila: "text-muted-foreground bg-surface",
  proxima: "text-status-preparo bg-status-preparo/15",
  no_local: "text-status-rota bg-status-rota/15",
  entregue: "text-status-pronto bg-status-pronto/15",
};
const COURIER_DOT: Record<string, string> = {
  disponivel: "bg-status-pronto",
  em_rota: "bg-status-rota",
  inativo: "bg-status-finalizado",
};

export function DeliveryQueueModal({
  open,
  focusCourierId,
  onClose,
  onOpenOrder,
}: {
  open: boolean;
  focusCourierId?: string | undefined;
  onClose: () => void;
  onOpenOrder: (id: string) => void;
}) {
  const { couriers, orders, setDeliveryStage } = useOrders();
  const active = couriers.filter((c) => c.status !== "inativo");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[calc(100%-1.5rem)] max-h-[90vh] overflow-y-auto scroll-thin p-0 gap-0 bg-ink-2 border-hairline rounded-2xl [&>button]:top-3 [&>button]:right-3">
        <div className="px-5 pt-5 pb-4 border-b border-hairline flex items-center gap-3">
          <div className="grid place-items-center size-9 rounded-lg bg-status-rota/15 ring-1 ring-status-rota/30">
            <Bike className="size-4 text-status-rota" />
          </div>
          <div>
            <DialogTitle className="font-display font-bold text-xl tracking-tight">Fila de entrega</DialogTitle>
            <p className="text-xs text-muted-foreground">Quem está com o quê, agora</p>
          </div>
        </div>

        <div className="p-5 grid sm:grid-cols-2 gap-3">
          {active.map((c) => {
            const list = orders
              .filter((o) => o.courierId === c.id && o.status === "em_rota")
              .sort(
                (a, b) =>
                  STAGE_ORDER.indexOf(a.deliveryStage ?? "na_fila") -
                  STAGE_ORDER.indexOf(b.deliveryStage ?? "na_fila"),
              );
            return (
              <section
                key={c.id}
                className={cn(
                  "rounded-xl bg-surface ring-1 ring-hairline overflow-hidden",
                  focusCourierId === c.id && "ring-2 ring-brand/60",
                )}
              >
                <header className="flex items-center gap-2 px-3 py-2.5 border-b border-hairline">
                  <i className={cn("size-2 rounded-full", COURIER_DOT[c.status])} />
                  <span className="font-semibold text-sm flex-1">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {COURIER_STATUS_LABEL[c.status]} · {list.length} {list.length === 1 ? "pedido" : "pedidos"}
                  </span>
                </header>
                {list.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground">Sem entregas na fila</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {list.map((o) => (
                      <li key={o.id} className="px-3 py-2.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenOrder(o.id)}
                          className="min-w-0 flex-1 text-left hover:opacity-80"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold tracking-tight">{shortId(o.id)}</span>
                            <span className="text-xs text-secondary-foreground">{channelLabel(o)}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {customerLabel(o)} · {o.address?.neighborhood} · {money(o.total)}
                          </div>
                        </button>
                        <select
                          aria-label="Etapa da entrega"
                          value={o.deliveryStage}
                          onChange={(e) => setDeliveryStage(o.id, e.target.value as DeliveryStage)}
                          className={cn(
                            "text-[11px] font-semibold rounded px-1.5 py-1 border-0 outline-none cursor-pointer",
                            STAGE_TONE[o.deliveryStage ?? "na_fila"],
                          )}
                        >
                          {(["na_fila", "proxima", "no_local", "entregue"] as DeliveryStage[]).map((s) => (
                            <option key={s} value={s} className="bg-ink-2 text-foreground">
                              {STAGE_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
