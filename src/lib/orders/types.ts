export type Channel = "delivery" | "mesa" | "balcao";
export type BalcaoMode = "mesa" | "avulso" | "entrega";

export type OrderStatus =
  | "recebido"
  | "pago"
  | "preparo"
  | "pronto"
  | "em_rota"
  | "finalizado"
  | "cancelado";

export type DeliveryStage = "na_fila" | "proxima" | "no_local" | "entregue";
export type CourierStatus = "disponivel" | "em_rota" | "inativo";

export type PaymentMethod = "pix" | "cartao_online" | "presencial";
export type PresentialMethod = "dinheiro" | "debito" | "credito" | "voucher";

export interface OrderAddon {
  qty: number;
  name: string;
  subtotal: number;
}

export interface OrderItem {
  id: string;
  qty: number;
  name: string;
  subtotal: number;
  variation?: string[];
  optionals?: string[];
  addons?: OrderAddon[];
}

export interface Payment {
  method: PaymentMethod;
  presentialMethod?: PresentialMethod;
  /** Valor com que o cliente vai pagar (só dinheiro) */
  changeFor?: number;
  /** Já foi pago no ato (pix/cartão online ou "pago no balcão") */
  paid: boolean;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  reference?: string;
}

export interface Order {
  id: string;
  createdAt: number;
  channel: Channel;
  balcaoMode?: BalcaoMode;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: Payment;
  address?: Address;
  notes?: string;
  disposables?: boolean;
  status: OrderStatus;
  courierId?: string | undefined;
  deliveryStage?: DeliveryStage | undefined;
}

export interface Courier {
  id: string;
  name: string;
  status: CourierStatus;
}

export type ChannelFilter = "todos" | Channel;
export type StatusFilter = "todos" | OrderStatus;
