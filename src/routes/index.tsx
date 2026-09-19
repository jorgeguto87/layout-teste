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
  CalendarDays,
  CreditCard,
  Download,
  Minus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getDashboard, brl, pct, type Canal, type Periodo } from "@/lib/financeiro-data";
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

function Financeiro() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [canal, setCanal] = useState<Canal>("todos");
  const [dataPersonalizada, setDataPersonalizada] = useState<Date | undefined>();

  const d = useMemo(() => getDashboard(periodo, canal), [periodo, canal]);

  const totalPagamentos = d.pagamentos.reduce((s, p) => s + p.valor, 0) || 1;
  const totalCanais = d.canais.reduce((s, c) => s + c.valor, 0) || 1;

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Financeiro
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {d.periodoLabel} · Eu Cardápio
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
                    onClick={() => setPeriodo(p.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      periodo === p.id
                        ? "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,107,44,0.32)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                      periodo === "personalizado"
                        ? "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,107,44,0.32)]"
                        : "bg-secondary text-secondary-foreground hover:bg-[#2d2d4e]",
                    )}
                  >
                    <CalendarDays className="size-4" strokeWidth={1.75} />
                    {dataPersonalizada
                      ? dataPersonalizada.toLocaleDateString("pt-BR")
                      : "Personalizado"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={dataPersonalizada}
                    onSelect={(date) => {
                      setDataPersonalizada(date);
                      setPeriodo("personalizado");
                    }}
                  />
                </PopoverContent>
              </Popover>
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
      </div>
    </div>
  );
}
