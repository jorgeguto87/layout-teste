import { createFileRoute } from "@tanstack/react-router";
import { PainelPedidos } from "@/components/PainelPedidos";

const titulo = "Fogueira KDS — Painel de pedidos do restaurante";
const descricao =
  "Receba e administre pedidos de mesa, delivery e balcão em um só painel: fila por status, impressão de comanda, impressão automática e lançamento de pedido no balcão.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
    ],
  }),
  component: Index,
});

function Index() {
  return <PainelPedidos />;
}
