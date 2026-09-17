import { useEffect, useMemo, useRef, useState } from "react";
import {
  brl,
  CANAL_LABEL,
  cronometro,
  minutos,
  MENU,
  pedidosIniciais,
  PROXIMO_STATUS,
  qtdItens,
  resumoItens,
  STATUS_LABEL,
  total,
  type Canal,
  type ItemPedido,
  type Pedido,
  type Status,
} from "@/lib/orders";

const corCanal: Record<Canal, string> = {
  mesa: "bg-mesa",
  delivery: "bg-delivery",
  balcao: "bg-balc",
};

const chipCanal: Record<Canal, string> = {
  mesa: "bg-mesa/15 text-mesa",
  delivery: "bg-delivery/15 text-delivery",
  balcao: "bg-balc/15 text-balc",
};

const COLUNAS: Status[] = ["recebido", "preparo", "pronto"];

export function PainelPedidos() {
  const [agora, setAgora] = useState(() => Date.now());
  const [pedidos, setPedidos] = useState<Pedido[]>(() =>
    pedidosIniciais(Date.now()),
  );
  const [selecionado, setSelecionado] = useState<number | null>(1042);
  const [autoImpressao, setAutoImpressao] = useState(true);
  const [novoAberto, setNovoAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [paraImprimir, setParaImprimir] = useState<Pedido | null>(null);
  const proximoId = useRef(1043);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const imprimir = (pedido: Pedido, automatico = false) => {
    setParaImprimir(pedido);
    setPedidos((atual) =>
      atual.map((p) => (p.id === pedido.id ? { ...p, impresso: true } : p)),
    );
    setAviso(
      automatico
        ? `Pedido #${pedido.id} impresso automaticamente`
        : `Pedido #${pedido.id} enviado para a impressora`,
    );
    setTimeout(() => {
      window.print();
      setParaImprimir(null);
    }, 60);
  };

  const adicionar = (pedido: Pedido) => {
    setPedidos((atual) => [pedido, ...atual]);
    setSelecionado(pedido.id);
    if (autoImpressao) imprimir(pedido, true);
  };

  const avancar = (id: number) => {
    setPedidos((atual) =>
      atual.map((p) => {
        if (p.id !== id) return p;
        const proximo = PROXIMO_STATUS[p.status];
        return proximo ? { ...p, status: proximo } : p;
      }),
    );
  };

  const contagem = useMemo(() => {
    const ativos = pedidos.filter((p) => p.status !== "finalizado");
    return {
      mesa: ativos.filter((p) => p.canal === "mesa").length,
      delivery: ativos.filter((p) => p.canal === "delivery").length,
      balcao: ativos.filter((p) => p.canal === "balcao").length,
    };
  }, [pedidos]);

  const detalhe = pedidos.find((p) => p.id === selecionado) ?? null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-frost font-body text-ink antialiased">
      <div className="rail-light pointer-events-none absolute inset-0 z-0 nao-imprimir" />

      <header className="nao-imprimir relative z-10 border-b border-line/50 bg-frost/85 backdrop-blur-sm">
        <div className="flex flex-wrap items-stretch gap-y-2 py-2 lg:h-16 lg:flex-nowrap lg:py-0">
          <div className="flex items-center gap-3 px-5">
            <div className="grid size-9 place-items-center rounded-md bg-ink font-display text-xl font-bold leading-none text-frost">
              E
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-lg font-bold tracking-tight text-ink">
                Eu Cardápio
              </h1>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                Painel de pedidos · Cozinha
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 px-5">
            {(["mesa", "delivery", "balcao"] as Canal[]).map((canal) => (
              <div
                key={canal}
                className="flex items-center gap-2 rounded-lg bg-paper px-3 py-1.5 ring-1 ring-ink/10"
              >
                <span className={`size-2 rounded-full ${corCanal[canal]}`} />
                <span className="font-mono text-xs uppercase text-ink/55">
                  {CANAL_LABEL[canal]}
                </span>
                <span className="font-display text-lg font-bold leading-none text-ink">
                  {contagem[canal]}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 border-line/50 pl-4 pr-5 lg:border-l">
            <button
              type="button"
              onClick={() => setAutoImpressao((v) => !v)}
              aria-pressed={autoImpressao}
              className="flex items-center gap-2"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                Impressão automática
              </span>
              <span className="relative inline-flex">
                <span
                  className={`block h-6 w-11 rounded-full ring-1 transition-colors ${
                    autoImpressao
                      ? "bg-balc ring-balc"
                      : "bg-ink/10 ring-ink/20"
                  }`}
                />
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-paper shadow transition-all ${
                    autoImpressao ? "right-0.5" : "left-0.5"
                  }`}
                />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setNovoAberto(true)}
              className="group inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-display text-base font-bold tracking-tight text-frost ring-1 ring-ink/20 transition-colors hover:bg-ink-2"
            >
              <span className="size-2.5 rounded-full bg-delivery group-hover:animate-pulse" />
              Novo pedido balcão
            </button>
          </div>
        </div>
      </header>

      {aviso && (
        <div className="nao-imprimir relative z-20 mx-4 mt-3 rounded-lg bg-balc/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-balc ring-1 ring-balc/30">
          {aviso}
        </div>
      )}

      <main className="nao-imprimir relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        {COLUNAS.map((status, indice) => {
          const daColuna = pedidos.filter((p) => p.status === status);
          return (
            <section
              key={status}
              className="flex min-h-0 flex-col lg:col-span-3"
            >
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="font-mono text-xs text-ink/35">
                  ({"abc"[indice]})
                </span>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                  {STATUS_LABEL[status]}
                </h2>
                <span className="ml-auto font-mono text-xs text-ink/45">
                  {daColuna.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {daColuna.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line/70 p-3 font-mono text-xs text-ink/30">
                    Nenhum pedido
                  </p>
                )}

                {daColuna.map((pedido) => (
                  <CartaoPedido
                    key={pedido.id}
                    pedido={pedido}
                    agora={agora}
                    ativo={pedido.id === selecionado}
                    onSelecionar={() => setSelecionado(pedido.id)}
                    onAvancar={() => avancar(pedido.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <aside className="relative min-h-0 lg:col-span-3">
          <PainelDetalhe
            pedido={detalhe}
            agora={agora}
            onImprimir={() => detalhe && imprimir(detalhe)}
            onAvancar={() => detalhe && avancar(detalhe.id)}
          />
        </aside>
      </main>

      {novoAberto && (
        <NovoPedidoBalcao
          onFechar={() => setNovoAberto(false)}
          onConfirmar={(itens, observacoes) => {
            const id = proximoId.current++;
            adicionar({
              id,
              canal: "balcao",
              referencia: "Balcão · Retirada",
              itens,
              ...(observacoes ? { observacoes } : {}),
              criadoEm: Date.now(),
              status: "recebido",
              impresso: false,
            });
            setNovoAberto(false);
          }}
        />
      )}

      <div className="area-impressao">
        {paraImprimir && <Comanda pedido={paraImprimir} />}
      </div>
    </div>
  );
}

function CartaoPedido({
  pedido,
  agora,
  ativo,
  onSelecionar,
  onAvancar,
}: {
  pedido: Pedido;
  agora: number;
  ativo: boolean;
  onSelecionar: () => void;
  onAvancar: () => void;
}) {
  const atrasado = minutos(pedido.criadoEm, agora) >= 8;
  return (
    <article
      onClick={onSelecionar}
      className={`group relative cursor-pointer overflow-hidden rounded-xl p-3 text-ink ring-1 transition-colors ${
        ativo
          ? "bg-paper shadow-md ring-2 ring-ink/60"
          : "bg-paper/70 ring-ink/10 hover:bg-paper"
      } ${!pedido.impresso ? "kpulse" : ""}`}
    >
      <div
        className={`absolute -left-px bottom-3 top-3 w-1 rounded-full ${corCanal[pedido.canal]}`}
      />
      <div className="flex items-start gap-3">
        <div className="font-display text-3xl font-bold leading-none">
          #{pedido.id}
        </div>
        <div className="ml-auto text-right">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${chipCanal[pedido.canal]}`}
          >
            {pedido.canal === "mesa"
              ? pedido.referencia
              : CANAL_LABEL[pedido.canal]}
          </span>
          <div
            className={`mt-1 font-mono text-[11px] font-medium ${
              atrasado ? "text-urg" : "text-ink/50"
            }`}
          >
            {cronometro(pedido.criadoEm, agora)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-pretty font-body text-sm text-ink/80">
        {resumoItens(pedido)}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2">
        <span className="font-mono text-xs text-ink/50">
          {qtdItens(pedido)} itens
        </span>
        <span className="font-display text-lg font-bold">
          {brl(total(pedido))}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAvancar();
        }}
        className="mt-2 w-full rounded-lg bg-ink px-3 py-2 font-display text-sm font-bold tracking-tight text-frost transition-colors hover:bg-ink-2"
      >

        {pedido.status === "recebido"
          ? "Iniciar preparo"
          : pedido.status === "preparo"
            ? "Marcar pronto"
            : "Finalizar"}
      </button>
    </article>
  );
}

function PainelDetalhe({
  pedido,
  agora,
  onImprimir,
  onAvancar,
}: {
  pedido: Pedido | null;
  agora: number;
  onImprimir: () => void;
  onAvancar: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-paper p-4 text-ink ring-1 ring-ink/10">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-mesa/10" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink/40">(d)</span>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
            Detalhe
          </h2>
        </div>
        {pedido && (
          <span className={`size-2.5 rounded-full ${corCanal[pedido.canal]}`} />
        )}
      </div>

      {!pedido ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink/40">
          Selecione um pedido
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-start gap-3">
            <div className="font-display text-5xl font-bold leading-none text-ink">
              #{pedido.id}
            </div>
            <div className="ml-auto text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${chipCanal[pedido.canal]}`}
              >
                {CANAL_LABEL[pedido.canal]}
              </span>
              <div className="mt-1 font-mono text-xs font-medium text-ink/60">
                {cronometro(pedido.criadoEm, agora)}
              </div>
            </div>
          </div>

          <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/40">
            {pedido.referencia} · {STATUS_LABEL[pedido.status]}
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto">
            {pedido.itens.map((item, i) => (
              <div
                key={`${item.nome}-${i}`}
                className="flex items-center justify-between border-b border-ink/10 pb-2"
              >
                <div className="text-sm text-ink">
                  <span className="mr-2 font-mono text-ink/40">
                    {item.qtd}×
                  </span>
                  {item.nome}
                </div>
                <span className="font-mono text-xs text-ink/60">
                  {brl(item.preco * item.qtd)}
                </span>
              </div>
            ))}
          </div>

          {pedido.observacoes && (
            <div className="mt-4 rounded-lg bg-ink/5 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                Observações
              </div>
              <p className="mt-1 text-pretty text-sm text-ink/80">
                {pedido.observacoes}
              </p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
                Total
              </span>
              <span className="font-display text-3xl font-bold leading-none text-ink">
                {brl(total(pedido))}
              </span>
            </div>
            <button
              type="button"
              onClick={onImprimir}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-display text-base font-bold uppercase tracking-tight text-frost ring-1 ring-ink/20 hover:bg-ink-2"
            >
              Imprimir pedido
            </button>
            {pedido.status !== "finalizado" && (
              <button
                type="button"
                onClick={onAvancar}
                className="mt-2 w-full rounded-lg bg-ink/5 px-4 py-2.5 font-display text-sm font-bold uppercase tracking-tight text-ink hover:bg-ink/10"
              >
                Avançar status
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NovoPedidoBalcao({
  onFechar,
  onConfirmar,
}: {
  onFechar: () => void;
  onConfirmar: (itens: ItemPedido[], observacoes: string) => void;
}) {
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [observacoes, setObservacoes] = useState("");

  const itens: ItemPedido[] = MENU.filter((m) => carrinho[m.nome]).map((m) => ({
    ...m,
    qtd: carrinho[m.nome]!,
  }));
  const soma = itens.reduce((s, i) => s + i.preco * i.qtd, 0);

  const mudar = (nome: string, delta: number) =>
    setCarrinho((c) => {
      const q = Math.max(0, (c[nome] ?? 0) + delta);
      const proximo = { ...c };
      if (q === 0) delete proximo[nome];
      else proximo[nome] = q;
      return proximo;
    });

  return (
    <div className="nao-imprimir fixed inset-0 z-40 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-paper text-ink ring-1 ring-ink/15">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Novo pedido balcão
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg bg-ink/5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink/60 hover:bg-ink/10"
          >
            Fechar
          </button>
        </div>

        <div className="grid gap-2 overflow-y-auto p-5 sm:grid-cols-2">
          {MENU.map((item) => (
            <div
              key={item.nome}
              className="flex items-center gap-3 rounded-lg bg-ink/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.nome}</div>
                <div className="font-mono text-[11px] text-ink/50">
                  {brl(item.preco)}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mudar(item.nome, -1)}
                  className="size-7 rounded-md bg-ink/10 font-display text-lg leading-none hover:bg-ink/20"
                >
                  −
                </button>
                <span className="w-5 text-center font-mono text-sm">
                  {carrinho[item.nome] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => mudar(item.nome, 1)}
                  className="size-7 rounded-md bg-ink text-frost font-display text-lg leading-none hover:bg-ink-2"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-ink/10 p-5">
          <label
            htmlFor="obs"
            className="font-mono text-[10px] uppercase tracking-widest text-ink/40"
          >
            Observações
          </label>
          <textarea
            id="obs"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            placeholder="Ex.: sem cebola, embalar para viagem"
            className="mt-1 w-full resize-none rounded-lg bg-ink/5 p-3 text-sm text-ink outline-none ring-1 ring-ink/10 focus:ring-mesa"
          />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                Total
              </div>
              <div className="font-display text-3xl font-bold leading-none">
                {brl(soma)}
              </div>
            </div>
            <button
              type="button"
              disabled={itens.length === 0}
              onClick={() => onConfirmar(itens, observacoes)}
              className="rounded-lg bg-ink px-5 py-3 font-display text-base font-bold uppercase tracking-tight text-frost hover:bg-ink-2 disabled:opacity-40"
            >
              Lançar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comanda({ pedido }: { pedido: Pedido }) {
  return (
    <div style={{ maxWidth: 320 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>FOGUEIRA</div>
      <div style={{ fontSize: 12 }}>
        {new Date(pedido.criadoEm).toLocaleString("pt-BR")}
      </div>
      <hr />
      <div style={{ fontSize: 22, fontWeight: 700 }}>#{pedido.id}</div>
      <div style={{ fontSize: 13 }}>
        {CANAL_LABEL[pedido.canal]} · {pedido.referencia}
      </div>
      <hr />
      {pedido.itens.map((i, k) => (
        <div
          key={`${i.nome}-${k}`}
          style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
        >
          <span>
            {i.qtd}x {i.nome}
          </span>
          <span>{brl(i.preco * i.qtd)}</span>
        </div>
      ))}
      <hr />
      {pedido.observacoes && (
        <div style={{ fontSize: 12 }}>OBS: {pedido.observacoes}</div>
      )}
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
        TOTAL {brl(total(pedido))}
      </div>
    </div>
  );
}
