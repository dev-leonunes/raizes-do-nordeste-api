import { ConflictException } from "@nestjs/common";
import { CanalPedido, PerfilUsuario, StatusPedido } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { PedidosService } from "./pedidos.service";

const usuarioCliente: UsuarioAutenticado = {
  id: "usuario-1",
  email: "cliente@raizes.local",
  perfil: PerfilUsuario.CLIENTE,
  unidadeId: null,
};

const itemPedido = {
  id: "item-1",
  produtoId: "produto-1",
  quantidade: 2,
  precoUnitario: 12.5,
  subtotal: 25,
  produto: { id: "produto-1", nome: "Baião" },
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
  itens: [itemPedido],
  pagamento: null,
};

type PrismaMock = {
  $transaction: ReturnType<typeof vi.fn>;
  unidade: { findUnique: ReturnType<typeof vi.fn> };
  produto: { findMany: ReturnType<typeof vi.fn> };
  estoque: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  pedido: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  auditoria: { create: ReturnType<typeof vi.fn> };
};

function criarPrismaMock(): PrismaMock {
  const prisma = {
    $transaction: vi.fn(),
    unidade: { findUnique: vi.fn() },
    produto: { findMany: vi.fn() },
    estoque: { findMany: vi.fn(), update: vi.fn() },
    pedido: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    auditoria: { create: vi.fn() },
  };
  prisma.$transaction.mockImplementation((arg) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
  );
  return prisma;
}

describe("PedidosService", () => {
  let prisma: PrismaMock;
  let service: PedidosService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new PedidosService(prisma as unknown as PrismaService);
  });

  it("calculates the order total from frozen item prices", async () => {
    prisma.unidade.findUnique.mockResolvedValue({ id: "unidade-1" });
    prisma.produto.findMany.mockResolvedValue([{ id: "produto-1", preco: 12.5, ativo: true }]);
    prisma.estoque.findMany.mockResolvedValue([{ produtoId: "produto-1", quantidade: 10 }]);
    prisma.pedido.create.mockResolvedValue(pedidoBase);
    prisma.auditoria.create.mockResolvedValue({});

    const pedido = await service.criar(
      {
        unidadeId: "unidade-1",
        canalPedido: CanalPedido.APP,
        itens: [{ produtoId: "produto-1", quantidade: 2 }],
      },
      usuarioCliente,
    );

    expect(prisma.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valorTotal: 25,
          itens: {
            create: [
              {
                produtoId: "produto-1",
                quantidade: 2,
                precoUnitario: 12.5,
                subtotal: 25,
              },
            ],
          },
        }),
      }),
    );
    expect(pedido.valorTotal).toBe(25);
  });

  it("rejects order creation when stock is insufficient", async () => {
    prisma.unidade.findUnique.mockResolvedValue({ id: "unidade-1" });
    prisma.produto.findMany.mockResolvedValue([{ id: "produto-1", preco: 12.5, ativo: true }]);
    prisma.estoque.findMany.mockResolvedValue([{ produtoId: "produto-1", quantidade: 1 }]);

    await expect(
      service.criar(
        {
          unidadeId: "unidade-1",
          canalPedido: CanalPedido.APP,
          itens: [{ produtoId: "produto-1", quantidade: 2 }],
        },
        usuarioCliente,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("does not decrease stock when creating an order", async () => {
    prisma.unidade.findUnique.mockResolvedValue({ id: "unidade-1" });
    prisma.produto.findMany.mockResolvedValue([{ id: "produto-1", preco: 12.5, ativo: true }]);
    prisma.estoque.findMany.mockResolvedValue([{ produtoId: "produto-1", quantidade: 10 }]);
    prisma.pedido.create.mockResolvedValue(pedidoBase);
    prisma.auditoria.create.mockResolvedValue({});

    await service.criar(
      {
        unidadeId: "unidade-1",
        canalPedido: CanalPedido.APP,
        itens: [{ produtoId: "produto-1", quantidade: 2 }],
      },
      usuarioCliente,
    );

    expect(prisma.estoque.update).not.toHaveBeenCalled();
  });

  it("rejects invalid order status transition", async () => {
    prisma.pedido.findUnique.mockResolvedValue(pedidoBase);

    await expect(
      service.atualizarStatus(
        "pedido-1",
        { status: StatusPedido.PRONTO },
        { ...usuarioCliente, perfil: PerfilUsuario.ADMIN },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
