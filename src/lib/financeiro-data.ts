export type Periodo = "hoje" | "semana" | "mes" | "personalizado";
export type Canal = "todos" | "delivery" | "mesa" | "balcao";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const canalPeso: Record<Canal, number> = {
  todos: 1,
  delivery: 0.52,
  mesa: 0.31,
  balcao: 0.17,
};

const periodoBase: Record<Periodo, { dias: number; label: string; fator: number }> = {
  hoje: { dias: 1, label: "Hoje", fator: 1 },
  semana: { dias: 7, label: "Últimos 7 dias", fator: 6.4 },
  mes: { dias: 30, label: "Últimos 30 dias", fator: 27.5 },
  personalizado: { dias: 14, label: "Período personalizado", fator: 13.1 },
};

const seed = [1, 0.86, 1.12, 0.94, 1.31, 1.48, 1.08, 0.91, 1.05, 1.22];

function diaValor(i: number, base: number) {
  return Math.round(base * (seed[i % seed.length] ?? 1) * (1 + ((i * 7) % 11) / 90));
}

export interface SerieDia {
  data: string;
  faturamento: number;
  pedidos: number;
}

export interface DashboardData {
  periodoLabel: string;
  faturamento: number;
  faturamentoVar: number;
  pedidos: number;
  pedidosVar: number;
  ticketMedio: number;
  ticketVar: number;
  cancelados: number;
  serie: SerieDia[];
  pagamentos: { nome: string; valor: number; cor: string }[];
  canais: { nome: string; valor: number; cor: string }[];
  produtos: { nome: string; qtd: number; total: number }[];
  entregadores: { nome: string; entregas: number; taxas: number }[];
}

export function getDashboard(periodo: Periodo, canal: Canal): DashboardData {
  const { dias, label, fator } = periodoBase[periodo];
  const peso = canalPeso[canal];
  const baseDia = 3480 * peso;

  const hoje = new Date(2026, 8, 19);
  const serie: SerieDia[] = Array.from({ length: dias }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (dias - 1 - i));
    const faturamento = diaValor(i, baseDia);
    return {
      data: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      faturamento,
      pedidos: Math.max(1, Math.round(faturamento / 57.4)),
    };
  });

  const faturamento = serie.reduce((s, d) => s + d.faturamento, 0);
  const pedidos = serie.reduce((s, d) => s + d.pedidos, 0);
  const ticketMedio = faturamento / pedidos;

  const pagamentosMix =
    canal === "delivery"
      ? [0.54, 0.31, 0.08, 0.07]
      : canal === "mesa"
        ? [0.38, 0.47, 0.11, 0.04]
        : canal === "balcao"
          ? [0.41, 0.33, 0.21, 0.05]
          : [0.46, 0.36, 0.12, 0.06];

  const pagamentos = [
    { nome: "Pix", cor: "#22C55E" },
    { nome: "Cartão", cor: "#FF6B2C" },
    { nome: "Dinheiro", cor: "#F59E0B" },
    { nome: "Pix manual", cor: "#1A1A2E" },
  ].map((p, i) => ({ ...p, valor: Math.round(faturamento * (pagamentosMix[i] ?? 0)) }));

  const canaisMix =
    canal === "todos"
      ? [0.52, 0.31, 0.17]
      : canal === "delivery"
        ? [1, 0, 0]
        : canal === "mesa"
          ? [0, 1, 0]
          : [0, 0, 1];

  const canais = [
    { nome: "Delivery", cor: "#FF6B2C" },
    { nome: "Mesa", cor: "#1A1A2E" },
    { nome: "Balcão", cor: "#F59E0B" },
  ].map((c, i) => ({ ...c, valor: Math.round(faturamento * (canaisMix[i] ?? 0)) }));

  const produtosBase = [
    { nome: "X-Burguer Artesanal", preco: 28.9, share: 0.148 },
    { nome: "Pizza Calabresa G", preco: 54.9, share: 0.132 },
    { nome: "Combo Executivo", preco: 34.5, share: 0.119 },
    { nome: "X-Salada Duplo", preco: 32.9, share: 0.101 },
    { nome: "Pizza Portuguesa G", preco: 57.9, share: 0.093 },
    { nome: "Batata Frita c/ Cheddar", preco: 24.0, share: 0.081 },
    { nome: "Refrigerante 2L", preco: 12.0, share: 0.073 },
    { nome: "Açaí 500ml", preco: 21.9, share: 0.062 },
    { nome: "Esfiha de Carne", preco: 7.5, share: 0.051 },
    { nome: "Suco Natural 500ml", preco: 11.5, share: 0.04 },
  ];

  const produtos = produtosBase.map((p) => {
    const total = Math.round(faturamento * p.share);
    return { nome: p.nome, qtd: Math.max(1, Math.round(total / p.preco)), total };
  });

  const entregasTotal =
    canal === "mesa" || canal === "balcao"
      ? 0
      : Math.round(pedidos * (canal === "delivery" ? 0.94 : 0.52));

  const entregadoresBase = [
    { nome: "Carlos Henrique", share: 0.27 },
    { nome: "Marcos Vinícius", share: 0.23 },
    { nome: "Jonatas Ferreira", share: 0.19 },
    { nome: "Rafael Souza", share: 0.16 },
    { nome: "Diego Nascimento", share: 0.15 },
  ];

  const entregadores = entregadoresBase.map((e) => {
    const entregas = Math.round(entregasTotal * e.share);
    return { nome: e.nome, entregas, taxas: Math.round(entregas * 7.5 * 100) / 100 };
  });

  return {
    periodoLabel: label,
    faturamento,
    faturamentoVar: canal === "mesa" ? -4.8 : 12.4 - fator / 10,
    pedidos,
    pedidosVar: canal === "balcao" ? -2.1 : 8.7,
    ticketMedio,
    ticketVar: 3.6,
    cancelados: Math.max(1, Math.round(pedidos * 0.026)),
    serie,
    pagamentos,
    canais,
    produtos,
    entregadores,
  };
}
