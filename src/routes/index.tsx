import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, History } from "lucide-react";
import { OrdersProvider, useOrders } from "@/lib/orders/store";
import { channelMatches, isOpen } from "@/lib/orders/format";
import type { ChannelFilter, StatusFilter } from "@/lib/orders/types";
import { ChannelFilterBar, StatusFilterBar } from "@/components/orders/FilterBar";
import { OrderBoard, OrderList } from "@/components/orders/OrderBoard";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { DeliveryQueueModal } from "@/components/orders/DeliveryQueueModal";
import { HistoryModal } from "@/components/orders/HistoryModal";
import { cn } from "@/lib/utils";

const TITLE = "Pedidos — Painel do restaurante";
const DESC =
  "Quadro operacional de pedidos por status para cozinha e balcão: delivery, mesa e balcão, fila de entrega e histórico.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OrdersProvider>
      <OrdersPage />
    </OrdersProvider>
  ),
});

const BOARD_STATUS: StatusFilter[] = ["todos", "recebido", "pago", "preparo", "pronto", "em_rota"];

const topBtn =
  "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-secondary-foreground ring-1 ring-hairline bg-surface hover:bg-surface-hover transition-colors";

function OrdersPage() {
  const { orders } = useOrders();
  const [channel, setChannel] = useState<ChannelFilter>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [queue, setQueue] = useState<{ open: boolean; courierId?: string | undefined }>({ open: false });
  const [history, setHistory] = useState(false);

  const visible = useMemo(
    () =>
      orders
        .filter((o) => isOpen(o) && channelMatches(o, channel) && (status === "todos" || o.status === status))
        .sort((a, b) => a.createdAt - b.createdAt),
    [orders, channel, status],
  );
  const activeCount = orders.filter(isOpen).length;
  const onRoute = orders.filter((o) => o.status === "em_rota").length;

  return (
    <div className="ops-ambient min-h-screen flex flex-col">
      <div className="ops-panel-diag -top-24 right-[-120px] h-[420px] w-[420px]" />
      <div className="ops-panel-diag top-40 left-[-160px] h-[380px] w-[380px] bg-brand/5 border-brand/15" />

      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-hairline bg-ink-2/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid place-items-center size-9 rounded-lg bg-brand/15 ring-1 ring-brand/30 shrink-0">
            <span className="font-display font-bold text-brand text-lg leading-none">K</span>
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="font-display font-semibold text-[15px] tracking-tight truncate">Kombu · Pedidos</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeCount} em andamento · {onRoute} em rota
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setHistory(true)} className={topBtn}>
            <History className="size-4 sm:hidden" />
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-status-finalizado" /> Histórico
            </span>
          </button>
          <button type="button" onClick={() => setQueue({ open: true })} className={topBtn}>
            <Bike className="size-4 sm:hidden" />
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-status-rota" /> Fila de entrega
            </span>
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-hairline bg-ink/40">
        <ChannelFilterBar value={channel} onChange={setChannel} />
        <StatusFilterBar value={status} onChange={setStatus} options={BOARD_STATUS} />
        <Legend className="ml-auto hidden xl:flex" />
      </div>

      <main className="flex-1 min-h-0 px-4 sm:px-5 py-4">
        <div className="hidden lg:block h-[calc(100vh-8.5rem)]">
          <OrderBoard orders={visible} onOpen={(o) => setDetailId(o.id)} />
        </div>
        <div className="lg:hidden">
          <OrderList orders={visible} onOpen={(o) => setDetailId(o.id)} />
        </div>
      </main>

      <OrderDetailModal
        orderId={detailId}
        onClose={() => setDetailId(null)}
        onOpenQueue={(courierId) => {
          setDetailId(null);
          setQueue({ open: true, courierId });
        }}
      />
      <DeliveryQueueModal
        open={queue.open}
        focusCourierId={queue.courierId}
        onClose={() => setQueue({ open: false })}
        onOpenOrder={(id) => {
          setQueue({ open: false });
          setDetailId(id);
        }}
      />
      <HistoryModal
        open={history}
        onClose={() => setHistory(false)}
        onOpenOrder={(id) => {
          setHistory(false);
          setDetailId(id);
        }}
      />
    </div>
  );
}

function Legend({ className }: { className?: string }) {
  const items = [
    ["bg-status-recebido", "Recebido"],
    ["bg-status-preparo", "Preparo"],
    ["bg-status-pronto", "Pronto"],
    ["bg-status-rota", "Em rota"],
  ] as const;
  return (
    <div className={cn("items-center gap-4 text-[11px] text-muted-foreground", className)}>
      {items.map(([dot, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <i className={cn("size-2 rounded-full", dot)} />
          {label}
        </span>
      ))}
    </div>
  );
}
