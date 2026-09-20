export type Periodo = "hoje" | "semana" | "mes";
export type Canal = "todos" | "delivery" | "mesa" | "balcao";

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const canalPeso: Record<Canal, number> = {
  todos: 1,
  delivery: 0.52,
  mesa: 0.31,
  balcao: 0.17,
};

const periodoBase: Record<Periodo, { dias: number; label: string }> = {
  hoje: { dias: 1, label: "Hoje" },
  semana: { dias: 7, label: "Últimos 7 dias" },
  mes: { dias: 30, label: "Últimos 30 dias" },
};

const seed = [1, 0.86, 1.12, 0.94, 1.31, 1.48, 1.08, 0.91, 1.05, 1.22];

function diaValor(i: number, base: number) {
  return Math.round(base * (seed[i % seed.length] ?? 1) * (1 + ((i * 7) % 11) / 90));
}

// ─── Núcleo: uma única fonte de verdade por dia ────────────────────────────
// "Hoje" é uma data fixa (mockup), e todo o resto — Visão geral, Ano, Mês,
// Semana, Dia — deriva do mesmo faturamentoDoDia(), indexado pela data
// absoluta (não pela posição dentro do período). É isso que garante que a
// soma dos dias de uma semana bata com a semana, a soma das semanas bata
// com o mês, e a soma dos meses bata com o ano.

export const HOJE = new Date(2026, 8, 19);

const EPOCH = new Date(2000, 0, 1);

function addDias(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function diffDias(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function indiceDoDia(data: Date) {
  return diffDias(data, EPOCH);
}

function faturamentoDoDia(data: Date, canal: Canal): number {
  const peso = canalPeso[canal];
  const base = 3480 * peso;
  return diaValor(indiceDoDia(data), base);
}

function pedidosDoDia(faturamento: number) {
  return Math.max(1, Math.round(faturamento / 57.4));
}

export interface SerieDia {
  data: string;
  faturamento: number;
  pedidos: number;
}

function serieDoIntervalo(canal: Canal, inicio: Date, fim: Date): SerieDia[] {
  const n = diffDias(fim, inicio) + 1;
  return Array.from({ length: Math.max(n, 0) }, (_, i) => {
    const d = addDias(inicio, i);
    const faturamento = faturamentoDoDia(d, canal);
    return {
      data: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      faturamento,
      pedidos: pedidosDoDia(faturamento),
    };
  });
}

function somaIntervalo(canal: Canal, inicio: Date, fim: Date) {
  const serie = serieDoIntervalo(canal, inicio, fim);
  const faturamento = serie.reduce((s, d) => s + d.faturamento, 0);
  const pedidos = serie.reduce((s, d) => s + d.pedidos, 0);
  return { faturamento, pedidos, serie };
}

function breakdowns(canal: Canal, faturamento: number, pedidos: number) {
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

  return { pagamentos, canais, produtos, entregadores };
}

export interface DashboardData {
  periodoLabel: string;
  faturamento: number;
  faturamentoVar: number | null;
  pedidos: number;
  pedidosVar: number | null;
  ticketMedio: number;
  ticketVar: number | null;
  cancelados: number;
  serie: SerieDia[];
  pagamentos: { nome: string; valor: number; cor: string }[];
  canais: { nome: string; valor: number; cor: string }[];
  produtos: { nome: string; qtd: number; total: number }[];
  entregadores: { nome: string; entregas: number; taxas: number }[];
}

function variacao(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function montarDashboard(canal: Canal, inicio: Date, fim: Date, label: string): DashboardData {
  const { faturamento, pedidos, serie } = somaIntervalo(canal, inicio, fim);
  const ticketMedio = pedidos ? faturamento / pedidos : 0;
  const cancelados = Math.max(1, Math.round(pedidos * 0.026));

  // Compara sempre com o período de mesma duração imediatamente anterior —
  // escolheu Março, compara com Fevereiro; escolheu a Semana 2, compara com
  // a Semana 1; etc.
  const duracao = diffDias(fim, inicio) + 1;
  const fimAnterior = addDias(inicio, -1);
  const inicioAnterior = addDias(fimAnterior, -(duracao - 1));
  const anterior = somaIntervalo(canal, inicioAnterior, fimAnterior);
  const ticketAnterior = anterior.pedidos ? anterior.faturamento / anterior.pedidos : 0;

  return {
    periodoLabel: label,
    faturamento,
    faturamentoVar: variacao(faturamento, anterior.faturamento),
    pedidos,
    pedidosVar: variacao(pedidos, anterior.pedidos),
    ticketMedio,
    ticketVar: variacao(ticketMedio, ticketAnterior),
    cancelados,
    serie,
    ...breakdowns(canal, faturamento, pedidos),
  };
}

export function getDashboard(periodo: Periodo, canal: Canal): DashboardData {
  const { dias, label } = periodoBase[periodo];
  const fim = HOJE;
  const inicio = addDias(fim, -(dias - 1));
  return montarDashboard(canal, inicio, fim, label);
}

export function getDashboardParaPeriodo(
  canal: Canal,
  inicio: Date,
  fim: Date,
  label: string,
): DashboardData {
  return montarDashboard(canal, inicio, fim, label);
}

// ─── Navegação histórica: Ano → Mês → Semana → Dia ─────────────────────────

export interface ItemPeriodo {
  chave: string;
  label: string;
  subtitle?: string;
  inicio: Date;
  fim: Date;
  total: number;
  pedidos: number;
}

export function getAnos(canal: Canal): ItemPeriodo[] {
  const anoAtual = HOJE.getFullYear();
  const anos = [anoAtual, anoAtual - 1];
  return anos.map((ano) => {
    const inicio = new Date(ano, 0, 1);
    const fim = ano === anoAtual ? HOJE : new Date(ano, 11, 31);
    const { faturamento, pedidos } = somaIntervalo(canal, inicio, fim);
    return { chave: String(ano), label: String(ano), inicio, fim, total: faturamento, pedidos };
  });
}

export function getMesesDoAno(canal: Canal, ano: number): ItemPeriodo[] {
  const anoAtual = HOJE.getFullYear();
  const ultimoMes = ano === anoAtual ? HOJE.getMonth() : 11;
  const meses: ItemPeriodo[] = [];
  for (let m = ultimoMes; m >= 0; m--) {
    const inicio = new Date(ano, m, 1);
    const fim = ano === anoAtual && m === ultimoMes ? HOJE : new Date(ano, m + 1, 0);
    const { faturamento, pedidos } = somaIntervalo(canal, inicio, fim);
    meses.push({ chave: `${ano}-${m}`, label: MESES[m] ?? "", inicio, fim, total: faturamento, pedidos });
  }
  return meses;
}

export function getSemanasDoMes(canal: Canal, ano: number, mes: number): ItemPeriodo[] {
  const anoAtual = HOJE.getFullYear();
  const primeiroDiaMes = new Date(ano, mes, 1);
  const ultimoDiaMes = ano === anoAtual && mes === HOJE.getMonth() ? HOJE : new Date(ano, mes + 1, 0);

  const semanas: ItemPeriodo[] = [];
  let cursor = new Date(primeiroDiaMes);
  let n = 1;
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  while (cursor <= ultimoDiaMes) {
    const diaSemana = cursor.getDay(); // 0 = domingo
    const diasAteSabado = 6 - diaSemana;
    let fimSemana = addDias(cursor, diasAteSabado);
    if (fimSemana > ultimoDiaMes) fimSemana = new Date(ultimoDiaMes);

    const { faturamento, pedidos } = somaIntervalo(canal, cursor, fimSemana);
    semanas.push({
      chave: `${ano}-${mes}-s${n}`,
      label: `Semana ${n}`,
      subtitle: `${fmt(cursor)} – ${fmt(fimSemana)}`,
      inicio: new Date(cursor),
      fim: fimSemana,
      total: faturamento,
      pedidos,
    });

    cursor = addDias(fimSemana, 1);
    n++;
  }
  return semanas.reverse();
}

export function getDiasDaSemana(canal: Canal, inicio: Date, fim: Date): ItemPeriodo[] {
  const dias: ItemPeriodo[] = [];
  for (let d = new Date(fim); d >= inicio; d.setDate(d.getDate() - 1)) {
    const dCopy = new Date(d);
    const faturamento = faturamentoDoDia(dCopy, canal);
    dias.push({
      chave: dCopy.toISOString().slice(0, 10),
      label: dCopy.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
      inicio: dCopy,
      fim: dCopy,
      total: faturamento,
      pedidos: pedidosDoDia(faturamento),
    });
  }
  return dias;
}

// ─── Comparação entre dois períodos ────────────────────────────────────────

export interface ComparativoData {
  labelA: string;
  labelB: string;
  a: DashboardData;
  b: DashboardData;
}

export function getComparativo(
  canal: Canal,
  periodoA: { inicio: Date; fim: Date; label: string },
  periodoB: { inicio: Date; fim: Date; label: string },
): ComparativoData {
  return {
    labelA: periodoA.label,
    labelB: periodoB.label,
    a: montarDashboard(canal, periodoA.inicio, periodoA.fim, periodoA.label),
    b: montarDashboard(canal, periodoB.inicio, periodoB.fim, periodoB.label),
  };
}
