import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Printer, MapPin, Utensils, ShoppingBag } from "lucide-react";
import {
  channelLabel,
  customerLabel,
  dateTimeFull,
  isOpen,
  money,
  needsDelivery,
  paymentSummary,
  shortId,
  STAGE_LABEL,
} from "@/lib/orders/format";
import { useOrders } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { cn } from "@/lib/utils";
import { CourierPicker } from "./CourierPicker";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { StatusBadge } from "./StatusBadge";

const ghostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium text-secondary-foreground ring-1 ring-hairline bg-surface hover:bg-surface-hover transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

const Box = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-lg bg-surface ring-1 ring-hairline p-3 text-sm", className)}>{children}</div>
);

export function OrderDetailModal({
  orderId,
  onClose,
  onOpenQueue,
}: {
  orderId: string | null;
  onClose: () => void;
  onOpenQueue: (courierId?: string) => void;
}) {
  const { orders } = useOrders();
  const order = orders.find((o) => o.id === orderId) ?? null;

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[calc(100%-1.5rem)] max-h-[92vh] overflow-y-auto scroll-thin p-0 gap-0 bg-ink-2 border-hairline rounded-2xl shadow-2xl [&>button]:top-3 [&>button]:right-3">
        {order && <Body order={order} onOpenQueue={onOpenQueue} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ order, onOpenQueue }: { order: Order; onOpenQueue: (courierId?: string) => void }) {
    const { couriers, cancel, finish, removeFromQueue, reprint } = useOrders();
    const courier = couriers.find((c) => c.id === order.courierId);
    const open = isOpen(order);
    const delivery = needsDelivery(order);
    const p = order.payment;

    return (
      <>
        <div className="pointer-events-none absolute -top-10 right-[-60px] h-40 w-40 bg-brand/10 ring-1 ring-brand/20 rotate-[18deg]" />

        {/* Cabeçalho */}
        <div className="relative px-5 pt-5 pb-4 border-b border-hairline pr-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <DialogTitle className="font-display font-bold text-4xl leading-none tracking-tight">
                  {shortId(order.id)}
                </DialogTitle>
                <StatusBadge status={order.status} size="md" />
              </div>
              <div className="mt-2 text-sm text-secondary-foreground">
                {channelLabel(order)} · {dateTimeFull(order.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                {customerLabel(order)}
                {order.customerName && order.customerPhone ? ` · ${order.customerPhone}` : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PrimaryActionButton order={order} size="lg" />
              <button type="button" onClick={() => reprint(order.id)} className={cn(ghostBtn, "h-9 px-3 text-sm")}>
                <Printer className="size-4" /> Reimprimir
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4 px-5 py-4">
          {/* Coluna esquerda */}
          <div className="md:col-span-3 space-y-4">
            <Section title="Itens">
              <div className="space-y-2.5">
                {order.items.map((it) => (
                  <Box key={it.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">
                        {it.qty} × {it.name}
                      </span>
                      <span className="font-display font-semibold tabular-nums">{money(it.subtotal)}</span>
                    </div>
                    {it.variation?.length ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">Variação: {it.variation.join(" · ")}</div>
                    ) : null}
                    {it.optionals?.length ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">Opcionais: {it.optionals.join(", ")}</div>
                    ) : null}
                    {it.addons?.length ? (
                      <div className="mt-1 text-[11px] text-brand">
                        Adicionais:{" "}
                        {it.addons.map((a) => `${a.qty} × ${a.name} · ${money(a.subtotal)}`).join(" | ")}
                      </div>
                    ) : null}
                  </Box>
                ))}
              </div>
              <Box className="mt-3 space-y-1 tabular-nums">
                <div className="flex justify-between text-secondary-foreground">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-secondary-foreground">
                    <span>Taxa de entrega</span>
                    <span>{money(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-display font-semibold text-base border-t border-hairline pt-1">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </Box>
            </Section>

            <Section title="Pagamento">
              <Box className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma</span>
                  <span className="font-medium">
                    {p.method === "presencial"
                      ? delivery
                        ? "Pagamento na entrega"
                        : "Pagamento no balcão"
                      : paymentSummary(p)}
                  </span>
                </div>
                {p.method === "presencial" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meio</span>
                    <span className="font-medium">{paymentSummary(p)}</span>
                  </div>
                )}
                {p.changeFor != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Troco</span>
                    <span className="font-medium tabular-nums">
                      paga {money(p.changeFor)} · leva {money(p.changeFor - order.total)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Situação</span>
                  <span className={cn("font-semibold", p.paid ? "text-status-pago" : "text-status-preparo")}>
                    {p.paid
                      ? p.method === "presencial"
                        ? "Pago no balcão"
                        : "Pago online"
                      : delivery
                        ? "Vai pagar na entrega"
                        : "Vai pagar depois"}
                  </span>
                </div>
              </Box>
            </Section>

            {order.notes && (
              <Section title="Observações">
                <Box className="text-secondary-foreground italic">“{order.notes}”</Box>
              </Section>
            )}
          </div>

          {/* Coluna direita */}
          <div className="md:col-span-2 space-y-4">
            {delivery ? (
              <Section title="Entrega">
                <Box className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <div>
                        {order.address?.street}, {order.address?.number}
                        {order.address?.complement ? ` · ${order.address.complement}` : ""}
                      </div>
                      <div className="text-secondary-foreground">{order.address?.neighborhood}</div>
                      {order.address?.reference && (
                        <div className="text-muted-foreground text-xs mt-0.5">Ref.: {order.address.reference}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-hairline">
                    <div className="text-[11px] text-muted-foreground mb-1.5">Entregador</div>
                    {courier ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{courier.name}</span>
                          {order.deliveryStage && (
                            <span className="text-[11px] font-semibold text-status-rota bg-status-rota/15 rounded px-1.5 py-0.5">
                              {STAGE_LABEL[order.deliveryStage]}
                            </span>
                          )}
                        </div>
                        {open && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <CourierPicker orderId={order.id} currentCourierId={courier.id}>
                              <button type="button" className={cn(ghostBtn, "h-8 px-2.5 text-xs")}>
                                Trocar
                              </button>
                            </CourierPicker>
                            <button
                              type="button"
                              onClick={() => onOpenQueue(courier.id)}
                              className={cn(ghostBtn, "h-8 px-2.5 text-xs")}
                            >
                              Ver fila
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromQueue(order.id)}
                              className={cn(ghostBtn, "h-8 px-2.5 text-xs")}
                            >
                              Remover da fila
                            </button>
                          </div>
                        )}
                        {order.status === "em_rota" && (
                          <button
                            type="button"
                            onClick={() => finish(order.id)}
                            className="mt-2 w-full h-8 rounded-md text-xs font-semibold text-status-pronto ring-1 ring-status-pronto/30 bg-status-pronto/10 hover:bg-status-pronto/20 transition-colors"
                          >
                            Finalizar manualmente (sem aguardar entregador)
                          </button>
                        )}
                      </>
                    ) : open ? (
                      <CourierPicker orderId={order.id}>
                        <button type="button" className={cn(ghostBtn, "w-full h-9 text-sm")}>
                          Atribuir entregador
                        </button>
                      </CourierPicker>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </Box>
              </Section>
            ) : (
              <Section title={order.channel === "mesa" || order.balcaoMode === "mesa" ? "Mesa" : "Retirada"}>
                <Box className="flex items-center gap-3">
                  {order.balcaoMode === "avulso" ? (
                    <ShoppingBag className="size-5 text-brand shrink-0" />
                  ) : (
                    <Utensils className="size-5 text-brand shrink-0" />
                  )}
                  <div>
                    {order.balcaoMode === "avulso" ? (
                      <div className="font-medium">Cliente aguarda e leva no balcão</div>
                    ) : (
                      <div className="font-display font-bold text-xl leading-none">Mesa {order.tableNumber}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.customerName ?? "Cliente não identificado"}
                    </div>
                  </div>
                </Box>
              </Section>
            )}

            {order.channel === "delivery" && (
              <Section title="Descartáveis">
                <Box className="text-secondary-foreground">
                  {order.disposables ? "Cliente pediu talheres/descartáveis" : "Sem talheres/descartáveis"}
                </Box>
              </Section>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => reprint(order.id)} className={cn(ghostBtn, "flex-1 h-9 text-sm")}>
                <Printer className="size-4" /> Reimprimir
              </button>
              {open && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 h-9 rounded-lg text-sm font-medium text-status-cancelado ring-1 ring-status-cancelado/30 bg-status-cancelado/10 hover:bg-status-cancelado/20 transition-colors"
                    >
                      Cancelar pedido
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-ink-2 border-hairline">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display">Cancelar {shortId(order.id)}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O pedido sai do quadro e fica registrado no histórico como cancelado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-surface border-hairline hover:bg-surface-hover">
                        Voltar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancel(order.id)}
                        className="bg-status-cancelado text-destructive-foreground hover:bg-status-cancelado/90"
                      >
                        Cancelar pedido
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
