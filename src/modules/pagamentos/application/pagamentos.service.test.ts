import {
  CanalPedido,
  PerfilUsuario,
  StatusPagamento,
  StatusPedido,
  TipoMovimentacaoEstoque,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { PagamentosService } from "./pagamentos.service";

const usuarioCliente: UsuarioAutenticado = {
  id: "usuario-1",
  email: "cliente@raizes.local",
  perfil: PerfilUsuario.CLIENTE,
  unidadeId: null,
};

const pedidoBase = {
  id: "pedido-1",
  codigo: "PED-1",
  clienteId: usuarioCliente.id,
  unidadeId: "unidade-1",
  canalPedido: CanalPedido.APP,
  status: StatusPedido.AGUARDANDO_PAGAMENTO,
  valorTotal: 25,
  criadoEm: new Date("2026-06-28T10:00:00.000Z"),
  atualizadoEm: new Date("2026-06-28T10:00:00.000Z"),
  canceladoEm: null,
  itens: [
    {
      id: "item-1",
      produtoId: "produto-1",
      quantidade: 2,
      precoUnitario: 12.5,
      subtotal: 25,
      produto: { id: "produto-1", nome: "Baião" },
    },
  ],
  pagamento: null,
};

type PrismaMock = {
  $transaction: ReturnType<typeof vi.fn>;
  estoque: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  pedido: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  pagamento: { upsert: ReturnType<typeof vi.fn> };
  movimentacaoEstoque: { create: ReturnType<typeof vi.fn> };
  auditoria: { create: ReturnType<typeof vi.fn> };
};

function criarPrismaMock(): PrismaMock {
  const prisma = {
    $transaction: vi.fn(),
    estoque: { findMany: vi.fn(), update: vi.fn() },
    pedido: { findUnique: vi.fn(), update: vi.fn() },
    pagamento: { upsert: vi.fn() },
    movimentacaoEstoque: { create: vi.fn() },
    auditoria: { create: vi.fn() },
  };
  prisma.$transaction.mockImplementation((arg) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
  );
  return prisma;
}

describe("PagamentosService", () => {
  let prisma: PrismaMock;
  let service: PagamentosService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new PagamentosService(prisma as unknown as PrismaService);
  });

  it("approves mock payment, decreases stock and updates order status to paid", async () => {
    prisma.pedido.findUnique.mockResolvedValue(pedidoBase);
    prisma.estoque.findMany.mockResolvedValue([{ produtoId: "produto-1", quantidade: 10 }]);
    prisma.pagamento.upsert.mockResolvedValue({ id: "pagamento-1" });
    prisma.estoque.update.mockResolvedValue({ id: "estoque-1" });
    prisma.movimentacaoEstoque.create.mockResolvedValue({ id: "movimentacao-1" });
    prisma.auditoria.create.mockResolvedValue({});
    prisma.pedido.update.mockResolvedValue({
      ...pedidoBase,
      status: StatusPedido.PAGO,
      pagamento: {
        id: "pagamento-1",
        metodo: "MOCK",
        status: StatusPagamento.APROVADO,
        valor: 25,
        referenciaExterna: "MOCK-1",
        pagoEm: new Date("2026-06-28T10:01:00.000Z"),
      },
    });

    const pedido = await service.pagarMock("pedido-1", { aprovado: true }, usuarioCliente);

    expect(prisma.estoque.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { quantidade: { decrement: 2 } },
      }),
    );
    expect(prisma.movimentacaoEstoque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: TipoMovimentacaoEstoque.SAIDA, quantidade: 2 }),
      }),
    );
    expect(pedido.status).toBe(StatusPedido.PAGO);
  });

  it("refuses mock payment without decreasing stock and updates order status", async () => {
    prisma.pedido.findUnique.mockResolvedValue(pedidoBase);
    prisma.pagamento.upsert.mockResolvedValue({ id: "pagamento-1" });
    prisma.auditoria.create.mockResolvedValue({});
    prisma.pedido.update.mockResolvedValue({
      ...pedidoBase,
      status: StatusPedido.PAGAMENTO_RECUSADO,
      pagamento: {
        id: "pagamento-1",
        metodo: "MOCK",
        status: StatusPagamento.RECUSADO,
        valor: 25,
        referenciaExterna: "MOCK-1",
        pagoEm: null,
      },
    });

    const pedido = await service.pagarMock("pedido-1", { aprovado: false }, usuarioCliente);

    expect(prisma.estoque.update).not.toHaveBeenCalled();
    expect(pedido.status).toBe(StatusPedido.PAGAMENTO_RECUSADO);
  });
});
