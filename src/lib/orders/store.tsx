import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { buildCouriers, buildOrders } from "./mock";
import { shortId } from "./format";
import type { Courier, DeliveryStage, Order, OrderStatus } from "./types";

interface OrdersState {
  orders: Order[];
  couriers: Courier[];
  /** Relógio compartilhado (atualiza a cada 30s) para "há X min". */
  now: number;
  setStatus: (id: string, status: OrderStatus) => void;
  startPrep: (id: string) => void;
  markReady: (id: string) => void;
  finish: (id: string) => void;
  cancel: (id: string) => void;
  assignCourier: (orderId: string, courierId: string) => void;
  removeFromQueue: (orderId: string) => void;
  setDeliveryStage: (orderId: string, stage: DeliveryStage) => void;
  reprint: (id: string) => void;
}

const Ctx = createContext<OrdersState | null>(null);

const recomputeCouriers = (couriers: Courier[], orders: Order[]): Courier[] =>
  couriers.map((c) => {
    if (c.status === "inativo") return c;
    const busy = orders.some((o) => o.courierId === c.id && o.status === "em_rota");
    return { ...c, status: busy ? "em_rota" : "disponivel" };
  });

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => buildOrders(1_800_000_000_000));
  const [couriers, setCouriers] = useState<Courier[]>(() => buildCouriers());
  const [now, setNow] = useState(1_800_000_000_000);

  useEffect(() => {
    const hydratedNow = Date.now();
    setNow(hydratedNow);
    setOrders(buildOrders(hydratedNow));
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const update = useCallback((id: string, patch: Partial<Order> | ((o: Order) => Partial<Order>)) => {
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, ...(typeof patch === "function" ? patch(o) : patch) } : o,
      );
      setCouriers((cs) => recomputeCouriers(cs, next));
      return next;
    });
  }, []);

  const setStatus = useCallback((id: string, status: OrderStatus) => update(id, { status }), [update]);

  const startPrep = useCallback(
    (id: string) => {
      update(id, { status: "preparo" });
      toast.success(`${shortId(id)} em preparo`);
    },
    [update],
  );

  const markReady = useCallback(
    (id: string) => {
      update(id, { status: "pronto" });
      toast.success(`${shortId(id)} pronto`);
    },
    [update],
  );

  const finish = useCallback(
    (id: string) => {
      update(id, (o) => ({
        status: "finalizado",
        deliveryStage: o.courierId ? "entregue" : o.deliveryStage,
      }));
      toast.success(`${shortId(id)} finalizado`);
    },
    [update],
  );

  const cancel = useCallback(
    (id: string) => {
      update(id, { status: "cancelado", courierId: undefined, deliveryStage: undefined });
      toast(`${shortId(id)} cancelado`);
    },
    [update],
  );

  const assignCourier = useCallback(
    (orderId: string, courierId: string) => {
      setOrders((prev) => {
        const hasActive = prev.some(
          (o) => o.courierId === courierId && o.status === "em_rota" && o.id !== orderId,
        );
        const next = prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                courierId,
                status: "em_rota" as const,
                deliveryStage: (hasActive ? "na_fila" : "proxima") as DeliveryStage,
              }
            : o,
        );
        setCouriers((cs) => recomputeCouriers(cs, next));
        return next;
      });
      toast.success(`${shortId(orderId)} saiu para entrega`);
    },
    [],
  );

  const removeFromQueue = useCallback(
    (orderId: string) => {
      update(orderId, { courierId: undefined, deliveryStage: undefined, status: "pronto" });
      toast(`${shortId(orderId)} removido da fila`);
    },
    [update],
  );

  const setDeliveryStage = useCallback(
    (orderId: string, stage: DeliveryStage) => {
      update(orderId, stage === "entregue" ? { deliveryStage: stage, status: "finalizado" } : { deliveryStage: stage });
    },
    [update],
  );

  const reprint = useCallback((id: string) => {
    toast.success(`Pedido ${shortId(id)} enviado para a impressora`);
  }, []);

  const value = useMemo<OrdersState>(
    () => ({
      orders,
      couriers,
      now,
      setStatus,
      startPrep,
      markReady,
      finish,
      cancel,
      assignCourier,
      removeFromQueue,
      setDeliveryStage,
      reprint,
    }),
    [orders, couriers, now, setStatus, startPrep, markReady, finish, cancel, assignCourier, removeFromQueue, setDeliveryStage, reprint],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
