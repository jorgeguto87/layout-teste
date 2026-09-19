import { cn } from "@/lib/utils";
import { boardColumn, STATUS_TONE, type BoardColumn } from "@/lib/orders/format";
import type { Order } from "@/lib/orders/types";
import { OrderCard, OrderRow } from "./OrderCard";

const COLUMNS: { key: BoardColumn; label: string }[] = [
  { key: "recebido", label: "Recebido" },
  { key: "preparo", label: "Preparo" },
  { key: "pronto", label: "Pronto" },
  { key: "em_rota", label: "Em rota" },
];

/** Quadro de 4 colunas (telas grandes). */
export function OrderBoard({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 min-h-0 h-full">
      {COLUMNS.map((col) => {
        const tone = STATUS_TONE[col.key];
        const list = orders.filter((o) => boardColumn(o) === col.key);
        return (
          <section
            key={col.key}
            className="flex flex-col min-h-0 rounded-xl bg-panel/60 ring-1 ring-hairline backdrop-blur-md overflow-hidden"
          >
            <header
              className={cn("flex items-center justify-between px-3 py-2 border-b border-hairline shrink-0", tone.soft)}
            >
              <span className={cn("font-display font-semibold text-sm tracking-tight", tone.text)}>{col.label}</span>
              <span className={cn("text-[11px] font-semibold rounded px-1.5 py-0.5 tabular-nums", tone.text, tone.soft)}>
                {list.length}
              </span>
            </header>
            <div className="p-2.5 space-y-2.5 overflow-y-auto scroll-thin flex-1">
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum pedido</p>
              ) : (
                list.map((o) => <OrderCard key={o.id} order={o} onOpen={onOpen} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Lista agrupada por etapa (celular). */
export function OrderList({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  return (
    <div className="space-y-5">
      {COLUMNS.map((col) => {
        const list = orders.filter((o) => boardColumn(o) === col.key);
        if (list.length === 0) return null;
        const tone = STATUS_TONE[col.key];
        return (
          <section key={col.key}>
            <h2 className={cn("flex items-center gap-2 font-display font-semibold text-sm mb-2", tone.text)}>
              <i className={cn("size-2 rounded-full", tone.bar)} />
              {col.label}
              <span className="text-muted-foreground font-normal">· {list.length}</span>
            </h2>
            <div className="space-y-2">
              {list.map((o) => (
                <OrderRow key={o.id} order={o} onOpen={onOpen} showStatus={false} />
              ))}
            </div>
          </section>
        );
      })}
      {orders.every((o) => boardColumn(o) === null) && (
        <p className="text-sm text-muted-foreground text-center py-10">Nenhum pedido em andamento</p>
      )}
    </div>
  );
}
