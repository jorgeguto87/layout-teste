export type Canal = "mesa" | "delivery" | "balcao";
export type Status = "recebido" | "preparo" | "pronto" | "finalizado";

export type ItemPedido = {
  nome: string;
  qtd: number;
  preco: number;
};

export type Pedido = {
  id: number;
  canal: Canal;
  referencia: string;
  itens: ItemPedido[];
  observacoes?: string;
  criadoEm: number;
  status: Status;
  impresso: boolean;
};

export const CANAL_LABEL: Record<Canal, string> = {
  mesa: "Mesa",
  delivery: "Delivery",
  balcao: "Balcão",
};

export const STATUS_LABEL: Record<Status, string> = {
  recebido: "Recebido",
  preparo: "Em preparo",
  pronto: "Pronto",
  finalizado: "Finalizado",
};

export const PROXIMO_STATUS: Record<Status, Status | null> = {
  recebido: "preparo",
  preparo: "pronto",
  pronto: "finalizado",
  finalizado: null,
};

export const MENU: ItemPedido[] = [
  { nome: "Picanha ao ponto", qtd: 1, preco: 60 },
  { nome: "Burger da casa", qtd: 1, preco: 38 },
  { nome: "Risoto de camarão", qtd: 1, preco: 72 },
  { nome: "Moqueca de peixe", qtd: 1, preco: 84 },
  { nome: "Feijoada", qtd: 1, preco: 54 },
  { nome: "Batata frita", qtd: 1, preco: 22 },
  { nome: "Pão de queijo", qtd: 1, preco: 8 },
  { nome: "Café coado", qtd: 1, preco: 6 },
  { nome: "Suco de uva", qtd: 1, preco: 12 },
  { nome: "Refrigerante", qtd: 1, preco: 9 },
  { nome: "Vinho tinto", qtd: 1, preco: 66 },
];

export const total = (p: Pedido) =>
  p.itens.reduce((s, i) => s + i.preco * i.qtd, 0);

export const qtdItens = (p: Pedido) => p.itens.reduce((s, i) => s + i.qtd, 0);

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const resumoItens = (p: Pedido) =>
  p.itens.map((i) => `${i.qtd}× ${i.nome}`).join(" · ");

export const cronometro = (criadoEm: number, agora: number) => {
  const s = Math.max(0, Math.floor((agora - criadoEm) / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const minutos = (criadoEm: number, agora: number) =>
  Math.floor((agora - criadoEm) / 60000);

const min = (n: number) => n * 60000;

export const pedidosIniciais = (agora: number): Pedido[] => [
  {
    id: 1042,
    canal: "mesa",
    referencia: "Mesa 7",
    itens: [
      { nome: "Picanha ao ponto", qtd: 2, preco: 60 },
      { nome: "Vinho tinto", qtd: 1, preco: 66 },
    ],
    observacoes: "Ponto médio, sem pimenta. Cliente alérgico a nozes.",
    criadoEm: agora - min(3),
    status: "recebido",
    impresso: false,
  },
  {
    id: 1041,
    canal: "delivery",
    referencia: "Rua das Palmeiras, 220 · Ana",
    itens: [
      { nome: "Burger da casa", qtd: 1, preco: 38 },
      { nome: "Batata frita", qtd: 2, preco: 22 },
    ],
    observacoes: "Entregar sem molho extra.",
    criadoEm: agora - min(6),
    status: "recebido",
    impresso: true,
  },
  {
    id: 1039,
    canal: "balcao",
    referencia: "Balcão · Retirada",
    itens: [
      { nome: "Café coado", qtd: 4, preco: 6 },
      { nome: "Pão de queijo", qtd: 2, preco: 8 },
    ],
    criadoEm: agora - min(1),
    status: "recebido",
    impresso: true,
  },
  {
    id: 1037,
    canal: "mesa",
    referencia: "Mesa 12",
    itens: [
      { nome: "Risoto de camarão", qtd: 1, preco: 72 },
      { nome: "Suco de uva", qtd: 2, preco: 12 },
    ],
    observacoes: "Sem cebola.",
    criadoEm: agora - min(9),
    status: "preparo",
    impresso: true,
  },
  {
    id: 1035,
    canal: "balcao",
    referencia: "Balcão · Retirada",
    itens: [
      { nome: "Feijoada", qtd: 2, preco: 54 },
      { nome: "Refrigerante", qtd: 1, preco: 9 },
    ],
    criadoEm: agora - min(4),
    status: "preparo",
    impresso: true,
  },
  {
    id: 1033,
    canal: "mesa",
    referencia: "Mesa 3",
    itens: [
      { nome: "Moqueca de peixe", qtd: 1, preco: 84 },
      { nome: "Suco de uva", qtd: 1, preco: 12 },
    ],
    criadoEm: agora - min(12),
    status: "pronto",
    impresso: true,
  },
];
