import type { Prisma } from "@prisma/client";

export const pedidoInclude = {
  itens: {
    select: {
      id: true,
      produtoId: true,
      quantidade: true,
      precoUnitario: true,
      subtotal: true,
      produto: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: "asc" },
  },
  pagamento: {
    select: {
      id: true,
      metodo: true,
      status: true,
      valor: true,
      referenciaExterna: true,
      pagoEm: true,
    },
  },
} satisfies Prisma.PedidoInclude;

export type PedidoComRelacoes = Prisma.PedidoGetPayload<{ include: typeof pedidoInclude }>;

export function mapearPedido(pedido: PedidoComRelacoes) {
  return {
    ...pedido,
    valorTotal: Number(pedido.valorTotal),
    itens: pedido.itens.map((item) => ({
      ...item,
      precoUnitario: Number(item.precoUnitario),
      subtotal: Number(item.subtotal),
    })),
    pagamento: pedido.pagamento
      ? {
          ...pedido.pagamento,
          valor: Number(pedido.pagamento.valor),
        }
      : null,
  };
}
