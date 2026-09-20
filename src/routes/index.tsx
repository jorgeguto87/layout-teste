import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Minus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  brl,
  getAnos,
  getComparativo,
  getDashboard,
  getDashboardParaPeriodo,
  getDiasDaSemana,
  getMesesDoAno,
  getSemanasDoMes,
  pct,
  type Canal,
  type ComparativoData,
  type DashboardData,
  type ItemPeriodo,
  type Periodo,
} from "@/lib/financeiro-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financeiro — Eu Cardápio" },
      {
        name: "description",
        content:
          "Painel financeiro do Eu Cardápio: faturamento, pedidos, ticket médio, formas de pagamento, canais de venda e desempenho dos entregadores.",
      },
      { property: "og:title", content: "Financeiro — Eu Cardápio" },
      {
        property: "og:description",
        content:
          "Acompanhe faturamento, pedidos e ticket médio do seu restaurante por período e canal de venda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

const periodos: { id: Periodo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

const canais: { id: Canal; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "delivery", label: "Delivery" },
  { id: "mesa", label: "Mesa" },
  { id: "balcao", label: "Balcão" },
];

type PeriodoEscolhido = { inicio: Date; fim: Date; label: string };
type Modo = "rapido" | "periodo" | "comparacao";

// ─── Componentes básicos (já existiam) ─────────────────────────────────────

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Variacao({ valor }: { valor: number | null }) {
  if (valor === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Minus className="size-3.5" strokeWidth={1.75} /> neutro
      </span>
    );
  }
  const positivo = valor >= 0;
  const Icon = positivo ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        positivo ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {pct(Math.abs(valor))}
    </span>
  );
}

function Kpi({
  icone: Icone,
  titulo,
  valor,
  variacao,
}: {
  icone: typeof Wallet;
  titulo: string;
  valor: string;
  variacao: number | null;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icone className="size-[18px]" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{titulo}</p>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{valor}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Variacao valor={variacao} />
        <span className="text-xs text-muted-foreground">vs. período anterior</span>
      </div>
    </Card>
  );
}

function Barra({
  nome,
  valor,
  porcentagem,
  cor,
}: {
  nome: string;
  valor: number;
  porcentagem: number;
  cor: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{nome}</p>
        <p className="text-sm font-semibold text-foreground">
          {brl(valor)}{" "}
          <span className="font-normal text-muted-foreground">({pct(porcentagem)})</span>
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${porcentagem}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-secondary px-3.5 py-2.5 text-secondary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-sm font-bold">{brl(d.faturamento)}</p>
      <p className="text-xs text-white/70">{d.pedidos} pedidos</p>
    </div>
  );
}

// ─── Componentes novos: comparação entre dois períodos ─────────────────────

function KpiComparativo({
  icone: Icone,
  titulo,
  a,
  b,
  formatar,
}: {
  icone: typeof Wallet;
  titulo: string;
  a: number;
  b: number;
  formatar: (v: number) => string;
}) {
  const delta = b > 0 ? ((a - b) / b) * 100 : null;
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icone className="size-[18px]" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{titulo}</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">A</p>
          <p className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {formatar(a)}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-secondary">B</p>
          <p className="truncate text-base font-semibold text-muted-foreground">{formatar(b)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Variacao valor={delta} />
        <span className="text-xs text-muted-foreground">A vs. B</span>
      </div>
    </Card>
  );
}

function BarraComparativa({
  nome,
  valorA,
  valorB,
  cor,
}: {
  nome: string;
  valorA: number;
  valorB: number;
  cor: string;
}) {
  const max = Math.max(valorA, valorB, 1);
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{nome}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{brl(valorA)}</span>{" "}
          <span className="text-primary">A</span> · {brl(valorB)}{" "}
          <span className="text-secondary">B</span>
        </p>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(valorA / max) * 100}%`, backgroundColor: cor }}
          />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full opacity-35 transition-all duration-500"
            style={{ width: `${(valorB / max) * 100}%`, backgroundColor: cor }}
          />
        </div>
      </div>
    </div>
  );
}

function ChartTooltipComparativo({ active, payload, labelA, labelB }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-secondary px-3.5 py-2.5 text-secondary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
      <p className="text-xs text-white/60">{d.posicao}</p>
      {d.faturamentoA != null && (
        <p className="mt-1 text-sm font-bold" style={{ color: "#FF8C5A" }}>
          {labelA}: {brl(d.faturamentoA)}
        </p>
      )}
      {d.faturamentoB != null && (
        <p className="text-sm font-bold text-white/80">
          {labelB}: {brl(d.faturamentoB)}
        </p>
      )}
    </div>
  );
}

// ─── Navegador de drill-down: Anos → Meses → Semanas → Dias ────────────────

type Nivel = "anos" | "meses" | "semanas" | "dias";

function SeletorPeriodo({
  canal,
  onEscolher,
}: {
  canal: Canal;
  onEscolher: (inicio: Date, fim: Date, label: string) => void;
}) {
  const [nivel, setNivel] = useState<Nivel>("anos");
  const [ano, setAno] = useState<number | null>(null);
  const [mes, setMes] = useState<number | null>(null);
  const [semana, setSemana] = useState<ItemPeriodo | null>(null);

  const anos = useMemo(() => getAnos(canal), [canal]);
  const meses = useMemo(() => (ano !== null ? getMesesDoAno(canal, ano) : []), [canal, ano]);
  const semanas = useMemo(
    () => (ano !== null && mes !== null ? getSemanasDoMes(canal, ano, mes) : []),
    [canal, ano, mes],
  );
  const dias = useMemo(
    () => (semana ? getDiasDaSemana(canal, semana.inicio, semana.fim) : []),
    [canal, semana],
  );

  const voltar = () => {
    if (nivel === "dias") {
      setNivel("semanas");
      setSemana(null);
    } else if (nivel === "semanas") {
      setNivel("meses");
      setMes(null);
    } else if (nivel === "meses") {
      setNivel("anos");
      setAno(null);
    }
  };

  const resumoNivel: ItemPeriodo | null =
    nivel === "meses"
      ? (anos.find((a) => a.chave === String(ano)) ?? null)
      : nivel === "semanas"
        ? (meses.find((m) => m.chave === `${ano}-${mes}`) ?? null)
        : nivel === "dias"
          ? semana
          : null;

  const lista: ItemPeriodo[] =
    nivel === "anos" ? anos : nivel === "meses" ? meses : nivel === "semanas" ? semanas : dias;

  return (
    <div className="mt-4">
      {nivel !== "anos" && (
        <button
          type="button"
          onClick={voltar}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="size-4" strokeWidth={2} /> Voltar
        </button>
      )}

      {resumoNivel && (
        <button
          type="button"
          onClick={() => onEscolher(resumoNivel.inicio, resumoNivel.fim, resumoNivel.label)}
          className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <span className="min-w-0 truncate text-sm font-semibold text-primary">
            Ver {resumoNivel.label} inteiro
          </span>
          <span className="shrink-0 text-sm font-bold text-primary">{brl(resumoNivel.total)}</span>
        </button>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {lista.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => {
              if (nivel === "anos") {
                setAno(Number(item.chave));
                setNivel("meses");
              } else if (nivel === "meses") {
                setMes(item.inicio.getMonth());
                setNivel("semanas");
              } else if (nivel === "semanas") {
                setSemana(item);
                setNivel("dias");
              } else {
                onEscolher(item.inicio, item.fim, item.label);
              }
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-foreground">
                {item.label}
              </p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{brl(item.total)}</p>
                <p className="text-[11px] text-muted-foreground">{item.pedidos} pedidos</p>
              </div>
              {nivel !== "dias" && (
                <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Modal: "Ver período" ou "Comparar" ────────────────────────────────────

function ModalEscolherPeriodo({
  open,
  onOpenChange,
  canal,
  onEscolherPeriodo,
  onEscolherComparacao,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canal: Canal;
  onEscolherPeriodo: (p: PeriodoEscolhido) => void;
  onEscolherComparacao: (a: PeriodoEscolhido, b: PeriodoEscolhido) => void;
}) {
  const [compA, setCompA] = useState<PeriodoEscolhido | null>(null);
  const [compB, setCompB] = useState<PeriodoEscolhido | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setCompA(null);
          setCompB(null);
        }
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolher período</DialogTitle>
          <DialogDescription>
            Navegue por ano, mês, semana ou dia — ou compare dois períodos entre si.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ver" className="mt-2">
          <TabsList>
            <TabsTrigger value="ver">Ver período</TabsTrigger>
            <TabsTrigger value="comparar">Comparar</TabsTrigger>
          </TabsList>

          <TabsContent value="ver">
            <SeletorPeriodo
              canal={canal}
              onEscolher={(inicio, fim, label) => {
                onEscolherPeriodo({ inicio, fim, label });
                onOpenChange(false);
              }}
            />
          </TabsContent>

          <TabsContent value="comparar">
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                  Período A
                </p>
                {compA ? (
                  <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
                    <span className="text-sm font-semibold capitalize text-primary">
                      {compA.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompA(null)}
                      className="text-xs font-medium text-primary underline underline-offset-2"
                    >
                      trocar
                    </button>
                  </div>
                ) : (
                  <SeletorPeriodo
                    canal={canal}
                    onEscolher={(inicio, fim, label) => setCompA({ inicio, fim, label })}
                  />
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">
                  Período B
                </p>
                {compB ? (
                  <div className="flex items-center justify-between rounded-2xl bg-secondary/10 px-4 py-3">
                    <span className="text-sm font-semibold capitalize text-secondary">
                      {compB.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompB(null)}
                      className="text-xs font-medium text-secondary underline underline-offset-2"
                    >
                      trocar
                    </button>
                  </div>
                ) : (
                  <SeletorPeriodo
                    canal={canal}
                    onEscolher={(inicio, fim, label) => setCompB({ inicio, fim, label })}
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!compA || !compB}
              onClick={() => {
                if (compA && compB) {
                  onEscolherComparacao(compA, compB);
                  onOpenChange(false);
                }
              }}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {compA && compB
                ? `Comparar ${compA.label} com ${compB.label}`
                : "Escolha os dois períodos pra comparar"}
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────

function Financeiro() {
  const [periodoRapido, setPeriodoRapido] = useState<Periodo>("semana");
  const [canal, setCanal] = useState<Canal>("todos");
  const [modo, setModo] = useState<Modo>("rapido");
  const [periodoEscolhido, setPeriodoEscolhido] = useState<PeriodoEscolhido | null>(null);
  const [comparacaoEscolhida, setComparacaoEscolhida] = useState<{
    a: PeriodoEscolhido;
    b: PeriodoEscolhido;
  } | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const d: DashboardData = useMemo(() => {
    if (modo === "periodo" && periodoEscolhido) {
      return getDashboardParaPeriodo(
        canal,
        periodoEscolhido.inicio,
        periodoEscolhido.fim,
        periodoEscolhido.label,
      );
    }
    return getDashboard(periodoRapido, canal);
  }, [modo, periodoEscolhido, periodoRapido, canal]);

  const comparativo: ComparativoData | null = useMemo(() => {
    if (modo !== "comparacao" || !comparacaoEscolhida) return null;
    return getComparativo(canal, comparacaoEscolhida.a, comparacaoEscolhida.b);
  }, [modo, comparacaoEscolhida, canal]);

  const serieComparada = useMemo(() => {
    if (!comparativo) return [];
    const n = Math.max(comparativo.a.serie.length, comparativo.b.serie.length);
    return Array.from({ length: n }, (_, i) => ({
      posicao: `Dia ${i + 1}`,
      faturamentoA: comparativo.a.serie[i]?.faturamento ?? null,
      faturamentoB: comparativo.b.serie[i]?.faturamento ?? null,
    }));
  }, [comparativo]);

  const totalPagamentos = d.pagamentos.reduce((s, p) => s + p.valor, 0) || 1;
  const totalCanais = d.canais.reduce((s, c) => s + c.valor, 0) || 1;

  const voltarParaRapido = () => {
    setModo("rapido");
    setPeriodoEscolhido(null);
    setComparacaoEscolhida(null);
  };

  const subtitulo =
    modo === "comparacao" && comparativo
      ? `Comparando ${comparativo.labelA} × ${comparativo.labelB}`
      : modo === "periodo" && periodoEscolhido
        ? periodoEscolhido.label
        : d.periodoLabel;

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Financeiro
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{subtitulo}</span>
                {modo !== "rapido" && (
                  <button
                    type="button"
                    onClick={voltarParaRapido}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
                  >
                    <X className="size-3" strokeWidth={2.5} /> limpar
                  </button>
                )}
                <span>· Eu Cardápio</span>
              </p>
            </div>
            <a
              href="/eu-cardapio-financeiro.zip"
              download="eu-cardapio-financeiro.zip"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-[#2d2d4e]"
            >
              <Download className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Baixar Código (.ZIP)</span>
              <span className="sm:hidden">.ZIP</span>
            </a>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-card p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                {periodos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPeriodoRapido(p.id);
                      setModo("rapido");
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      modo === "rapido" && periodoRapido === p.id
                        ? "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,107,44,0.32)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  modo !== "rapido"
                    ? "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,107,44,0.32)]"
                    : "bg-secondary text-secondary-foreground hover:bg-[#2d2d4e]",
                )}
              >
                <CalendarRange className="size-4" strokeWidth={1.75} />
                Escolher período
              </button>
            </div>

            <div className="inline-flex flex-wrap gap-1 rounded-full bg-card p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              {canais.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCanal(c.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    canal === c.id
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <ModalEscolherPeriodo
          open={modalAberto}
          onOpenChange={setModalAberto}
          canal={canal}
          onEscolherPeriodo={(p) => {
            setPeriodoEscolhido(p);
            setModo("periodo");
          }}
          onEscolherComparacao={(a, b) => {
            setComparacaoEscolhida({ a, b });
            setModo("comparacao");
          }}
        />

        {modo === "comparacao" && comparativo ? (
          <>
            <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiComparativo
                icone={Wallet}
                titulo="Faturamento total"
                a={comparativo.a.faturamento}
                b={comparativo.b.faturamento}
                formatar={brl}
              />
              <KpiComparativo
                icone={ShoppingBag}
                titulo="Pedidos"
                a={comparativo.a.pedidos}
                b={comparativo.b.pedidos}
                formatar={(v) => String(v)}
              />
              <KpiComparativo
                icone={Receipt}
                titulo="Ticket médio"
                a={comparativo.a.ticketMedio}
                b={comparativo.b.ticketMedio}
                formatar={brl}
              />
              <KpiComparativo
                icone={TrendingUp}
                titulo="Pedidos cancelados"
                a={comparativo.a.cancelados}
                b={comparativo.b.cancelados}
                formatar={(v) => String(v)}
              />
            </section>

            <Card className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Evolução do faturamento
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Dia a dia, alinhado pela posição dentro de cada período
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="size-2.5 rounded-full bg-primary" /> {comparativo.labelA}
                  </span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="size-2.5 rounded-full bg-secondary" /> {comparativo.labelB}
                  </span>
                </div>
              </div>
              <div className="mt-6 h-64 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serieComparada} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fill-a" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B2C" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#FF6B2C" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fill-b" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1A1A2E" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#1A1A2E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="posicao"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      minTickGap={16}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltipComparativo
                          labelA={comparativo.labelA}
                          labelB={comparativo.labelB}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="faturamentoA"
                      stroke="#FF6B2C"
                      strokeWidth={2.5}
                      fill="url(#fill-a)"
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="faturamentoB"
                      stroke="#1A1A2E"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="url(#fill-b)"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">Formas de pagamento</h2>
                </div>
                <div className="mt-6 space-y-5">
                  {comparativo.a.pagamentos.map((p, i) => (
                    <BarraComparativa
                      key={p.nome}
                      nome={p.nome}
                      valorA={p.valor}
                      valorB={comparativo.b.pagamentos[i]?.valor ?? 0}
                      cor={p.cor}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShoppingBag className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">Canais de venda</h2>
                </div>
                <div className="mt-6 space-y-5">
                  {comparativo.a.canais.map((c, i) => (
                    <BarraComparativa
                      key={c.nome}
                      nome={c.nome}
                      valorA={c.valor}
                      valorB={comparativo.b.canais[i]?.valor ?? 0}
                      cor={c.cor}
                    />
                  ))}
                </div>
              </Card>
            </section>

            <Card className="mt-6">
              <h2 className="text-base font-semibold text-foreground">Produtos mais vendidos</h2>
              <p className="text-sm text-muted-foreground">Top 5 de cada período</p>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {[
                  { label: comparativo.labelA, dados: comparativo.a.produtos, cor: "text-primary" },
                  { label: comparativo.labelB, dados: comparativo.b.produtos, cor: "text-secondary" },
                ].map((col) => (
                  <div key={col.label}>
                    <p className={cn("mb-2 text-xs font-bold uppercase tracking-wide", col.cor)}>
                      {col.label}
                    </p>
                    <ul className="divide-y divide-border">
                      {col.dados.slice(0, 5).map((p, i) => (
                        <li
                          key={p.nome}
                          className="flex items-center justify-between gap-2 py-2.5"
                        >
                          <span className="min-w-0 truncate text-sm text-foreground">
                            {i + 1}. {p.nome}
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-foreground">
                            {brl(p.total)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="mt-6 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bike className="size-[18px]" strokeWidth={1.75} />
                </span>
                <h2 className="text-base font-semibold text-foreground">
                  Detalhamento por entregador
                </h2>
              </div>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {[
                  { label: comparativo.labelA, dados: comparativo.a.entregadores, cor: "text-primary" },
                  { label: comparativo.labelB, dados: comparativo.b.entregadores, cor: "text-secondary" },
                ].map((col) => (
                  <div key={col.label}>
                    <p className={cn("mb-2 text-xs font-bold uppercase tracking-wide", col.cor)}>
                      {col.label}
                    </p>
                    {col.dados.every((e) => e.entregas === 0) ? (
                      <p className="text-sm text-muted-foreground">Nenhuma entrega.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {col.dados.map((e) => (
                          <li
                            key={e.nome}
                            className="flex items-center justify-between gap-2 py-2.5"
                          >
                            <span className="min-w-0 truncate text-sm text-foreground">
                              {e.nome}
                            </span>
                            <span className="shrink-0 text-right text-sm text-muted-foreground">
                              {e.entregas} entregas ·{" "}
                              <span className="font-semibold text-foreground">
                                {brl(e.taxas)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi
                icone={Wallet}
                titulo="Faturamento total"
                valor={brl(d.faturamento)}
                variacao={d.faturamentoVar}
              />
              <Kpi
                icone={ShoppingBag}
                titulo="Pedidos"
                valor={String(d.pedidos)}
                variacao={d.pedidosVar}
              />
              <Kpi
                icone={Receipt}
                titulo="Ticket médio"
                valor={brl(d.ticketMedio)}
                variacao={d.ticketVar}
              />
              <Kpi
                icone={TrendingUp}
                titulo="Pedidos cancelados"
                valor={String(d.cancelados)}
                variacao={null}
              />
            </section>

            <Card className="mt-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    Evolução do faturamento
                  </h2>
                  <p className="text-sm text-muted-foreground">Dia a dia no período selecionado</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {brl(d.faturamento)}
                </span>
              </div>
              <div className="mt-6 h-64 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.serie} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fill-fat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B2C" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#FF6B2C" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="data"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      minTickGap={16}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#FF8C5A" }} />
                    <Area
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#FF6B2C"
                      strokeWidth={2.5}
                      fill="url(#fill-fat)"
                      dot={d.serie.length <= 10 ? { r: 3, fill: "#FF6B2C" } : false}
                      activeDot={{ r: 5, fill: "#FF6B2C", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">Formas de pagamento</h2>
                </div>
                <div className="mt-6 space-y-5">
                  {d.pagamentos.map((p) => (
                    <Barra
                      key={p.nome}
                      nome={p.nome}
                      valor={p.valor}
                      porcentagem={(p.valor / totalPagamentos) * 100}
                      cor={p.cor}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShoppingBag className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-base font-semibold text-foreground">Canais de venda</h2>
                </div>
                <div className="mt-6 space-y-5">
                  {d.canais.map((c) => (
                    <Barra
                      key={c.nome}
                      nome={c.nome}
                      valor={c.valor}
                      porcentagem={(c.valor / totalCanais) * 100}
                      cor={c.cor}
                    />
                  ))}
                </div>
              </Card>
            </section>

            <Card className="mt-6">
              <h2 className="text-base font-semibold text-foreground">Produtos mais vendidos</h2>
              <p className="text-sm text-muted-foreground">Top 10 do período</p>
              <ul className="mt-5 divide-y divide-border">
                {d.produtos.map((p, i) => (
                  <li
                    key={p.nome}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3"
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                        i === 0
                          ? "bg-primary text-primary-foreground"
                          : i < 3
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.qtd} unidades vendidas</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{brl(p.total)}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="mt-6 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bike className="size-[18px]" strokeWidth={1.75} />
                </span>
                <h2 className="text-base font-semibold text-foreground">
                  Detalhamento por entregador
                </h2>
              </div>
              {d.entregadores.every((e) => e.entregas === 0) ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  Nenhuma entrega no canal selecionado.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left">
                    <thead>
                      <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="pb-3">Entregador</th>
                        <th className="pb-3 text-right">Entregas</th>
                        <th className="pb-3 text-right">Taxas recebidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {d.entregadores.map((e) => (
                        <tr key={e.nome}>
                          <td className="py-3 text-sm font-medium text-foreground">{e.nome}</td>
                          <td className="py-3 text-right text-sm text-muted-foreground">
                            {e.entregas}
                          </td>
                          <td className="py-3 text-right text-sm font-semibold text-foreground">
                            {brl(e.taxas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
