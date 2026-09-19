import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { History } from "lucide-react";
import { channelMatches } from "@/lib/orders/format";
import { useOrders } from "@/lib/orders/store";
import type { ChannelFilter, StatusFilter } from "@/lib/orders/types";
import { ChannelFilterBar, StatusFilterBar } from "./FilterBar";
import { OrderRow } from "./OrderCard";

const STATUS_OPTIONS: StatusFilter[] = [
  "todos",
  "recebido",
  "pago",
  "preparo",
  "pronto",
  "em_rota",
  "finalizado",
  "cancelado",
];

export function HistoryModal({
  open,
  onClose,
  onOpenOrder,
}: {
  open: boolean;
  onClose: () => void;
  onOpenOrder: (id: string) => void;
}) {
  const { orders } = useOrders();
  const [channel, setChannel] = useState<ChannelFilter>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");

  const list = orders
    .filter((o) => channelMatches(o, channel) && (status === "todos" || o.status === status))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[calc(100%-1.5rem)] max-h-[90vh] flex flex-col p-0 gap-0 bg-ink-2 border-hairline rounded-2xl [&>button]:top-3 [&>button]:right-3">
        <div className="px-5 pt-5 pb-4 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-9 rounded-lg bg-surface ring-1 ring-hairline">
              <History className="size-4 text-secondary-foreground" />
            </div>
            <div>
              <DialogTitle className="font-display font-bold text-xl tracking-tight">Histórico de pedidos</DialogTitle>
              <p className="text-xs text-muted-foreground">Todos os pedidos, incluindo finalizados e cancelados</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ChannelFilterBar value={channel} onChange={setChannel} />
            <StatusFilterBar value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto scroll-thin">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhum pedido com esses filtros</p>
          ) : (
            list.map((o) => <OrderRow key={o.id} order={o} onOpen={(x) => onOpenOrder(x.id)} showAction={false} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
