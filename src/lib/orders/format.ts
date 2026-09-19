import type {
  Channel,
  ChannelFilter,
  CourierStatus,
  DeliveryStage,
  Order,
  OrderStatus,
  Payment,
  StatusFilter,
} from "./types";

export const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const shortId = (id: string) => `#${id.slice(-3).toUpperCase()}`;

export const timeHM = (ts: number) =>
  new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const dateTimeFull = (ts: number) =>
  new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const elapsedLabel = (ts: number, now: number) => {
  const min = Math.max(0, Math.floor((now - ts) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recebido: "Recebido",
  pago: "Pago",
  preparo: "Preparo",
  pronto: "Pronto",
  em_rota: "Em rota",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  todos: "Todos",
  recebido: "Novos",
  pago: "Pagos",
  preparo: "Preparo",
  pronto: "Prontos",
  em_rota: "Em rota",
  finalizado: "Concluídos",
  cancelado: "Cancelados",
};

export const CHANNEL_FILTER_LABEL: Record<ChannelFilter, string> = {
  todos: "Todos os canais",
  delivery: "Delivery",
  mesa: "Mesa",
  balcao: "Balcão",
};

export const STAGE_LABEL: Record<DeliveryStage, string> = {
  na_fila: "na fila",
  proxima: "próxima entrega",
  no_local: "no local",
  entregue: "entregue",
};

export const COURIER_STATUS_LABEL: Record<CourierStatus, string> = {
  disponivel: "disponível",
  em_rota: "em rota",
  inativo: "inativo",
};

/** Token class fragments per status (text / bg / ring / solid button). */
export const STATUS_TONE: Record<
  OrderStatus,
  { text: string; soft: string; ring: string; solid: string; bar: string }
> = {
  recebido: {
    text: "text-status-recebido",
    soft: "bg-status-recebido/15",
    ring: "ring-status-recebido/30",
    solid: "bg-status-recebido hover:bg-status-recebido/90",
    bar: "bg-status-recebido",
  },
  pago: {
    text: "text-status-pago",
    soft: "bg-status-pago/15",
    ring: "ring-status-pago/30",
    solid: "bg-status-pago hover:bg-status-pago/90",
    bar: "bg-status-pago",
  },
  preparo: {
    text: "text-status-preparo",
    soft: "bg-status-preparo/15",
    ring: "ring-status-preparo/30",
    solid: "bg-status-preparo hover:bg-status-preparo/90",
    bar: "bg-status-preparo",
  },
  pronto: {
    text: "text-status-pronto",
    soft: "bg-status-pronto/15",
    ring: "ring-status-pronto/30",
    solid: "bg-status-pronto hover:bg-status-pronto/90",
    bar: "bg-status-pronto",
  },
  em_rota: {
    text: "text-status-rota",
    soft: "bg-status-rota/15",
    ring: "ring-status-rota/30",
    solid: "bg-status-rota hover:bg-status-rota/90",
    bar: "bg-status-rota",
  },
  finalizado: {
    text: "text-status-finalizado",
    soft: "bg-status-finalizado/15",
    ring: "ring-status-finalizado/30",
    solid: "bg-status-finalizado hover:bg-status-finalizado/90",
    bar: "bg-status-finalizado",
  },
  cancelado: {
    text: "text-status-cancelado",
    soft: "bg-status-cancelado/15",
    ring: "ring-status-cancelado/30",
    solid: "bg-status-cancelado hover:bg-status-cancelado/90",
    bar: "bg-status-cancelado",
  },
};

export const channelLabel = (o: Pick<Order, "channel" | "balcaoMode" | "tableNumber">) => {
  if (o.channel === "delivery") return "Delivery";
  if (o.channel === "mesa") return `Mesa ${o.tableNumber ?? "—"}`;
  switch (o.balcaoMode) {
    case "mesa":
      return `Balcão · Mesa ${o.tableNumber ?? "—"}`;
    case "entrega":
      return "Balcão · Entrega";
    default:
      return "Balcão · Avulso";
  }
};

export const channelMatches = (o: Order, f: ChannelFilter) => f === "todos" || o.channel === f;

/** Pedido precisa de entregador (delivery ou balcão-entrega). */
export const needsDelivery = (o: Pick<Order, "channel" | "balcaoMode">) =>
  o.channel === "delivery" || (o.channel === "balcao" && o.balcaoMode === "entrega");

/** Sem identificação de cliente → "Cliente no local". */
export const customerLabel = (o: Order) =>
  o.customerName ?? o.customerPhone ?? "Cliente no local";

export const isOpen = (o: Order) => o.status !== "finalizado" && o.status !== "cancelado";

/** Coluna do quadro em que o pedido aparece (null = fora do quadro). */
export type BoardColumn = "recebido" | "preparo" | "pronto" | "em_rota";
export const boardColumn = (o: Order): BoardColumn | null => {
  switch (o.status) {
    case "recebido":
    case "pago":
      return "recebido";
    case "preparo":
    case "pronto":
    case "em_rota":
      return o.status;
    default:
      return null;
  }
};

export type PrimaryAction =
  | { kind: "start_prep"; label: string }
  | { kind: "mark_ready"; label: string }
  | { kind: "assign_courier"; label: string }
  | { kind: "finish"; label: string }
  | null;

export const primaryAction = (o: Order): PrimaryAction => {
  switch (o.status) {
    case "recebido":
    case "pago":
      return { kind: "start_prep", label: "Iniciar preparo" };
    case "preparo":
      return { kind: "mark_ready", label: "Marcar como pronto" };
    case "pronto":
      return needsDelivery(o)
        ? { kind: "assign_courier", label: "Atribuir entregador" }
        : { kind: "finish", label: "Concluir pedido" };
    case "em_rota":
      return { kind: "finish", label: "Marcar entregue" };
    default:
      return null;
  }
};

export const paymentSummary = (p: Payment) => {
  if (p.method === "pix") return "Pix";
  if (p.method === "cartao_online") return "Cartão online";
  const meio: Record<NonNullable<Payment["presentialMethod"]>, string> = {
    dinheiro: "Dinheiro",
    debito: "Cartão de débito",
    credito: "Cartão de crédito",
    voucher: "Voucher (VR/VA)",
  };
  return p.presentialMethod ? meio[p.presentialMethod] : "Presencial";
};

export const channelOf = (c: Channel) => c;
