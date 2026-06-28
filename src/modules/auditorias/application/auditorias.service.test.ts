import { AcaoAuditoria, PerfilUsuario } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import { AuditoriasService } from "./auditorias.service";

describe("AuditoriasService", () => {
  it("lists audits with pagination", async () => {
    const auditorias = [
      {
        id: "auditoria-1",
        usuarioId: "usuario-1",
        acao: AcaoAuditoria.PEDIDO_CRIADO,
        entidade: "Pedido",
        entidadeId: "pedido-1",
        metadata: { codigo: "PED-1" },
        criadoEm: new Date("2026-06-28T10:00:00.000Z"),
        usuario: null,
      },
    ];
    const prisma = criarPrismaMock(auditorias, 15);
    const service = new AuditoriasService(prisma as unknown as PrismaService);

    const resposta = await service.listar({ page: 2, limit: 10 });

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { criadoEm: "desc" },
        skip: 10,
        take: 10,
      }),
    );
    expect(resposta.data).toEqual(auditorias);
    expect(resposta.meta).toEqual({
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it("filters audits by action", async () => {
    const prisma = criarPrismaMock([], 0);
    const service = new AuditoriasService(prisma as unknown as PrismaService);

    await service.listar({ page: 1, limit: 10, acao: AcaoAuditoria.PAGAMENTO_APROVADO });

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { acao: AcaoAuditoria.PAGAMENTO_APROVADO },
      }),
    );
    expect(prisma.auditoria.count).toHaveBeenCalledWith({
      where: { acao: AcaoAuditoria.PAGAMENTO_APROVADO },
    });
  });

  it("filters audits by entity", async () => {
    const prisma = criarPrismaMock([], 0);
    const service = new AuditoriasService(prisma as unknown as PrismaService);

    await service.listar({ page: 1, limit: 10, entidade: "Pedido" });

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { entidade: "Pedido" },
      }),
    );
  });

  it("does not return senhaHash for related users", async () => {
    const auditorias = [
      {
        id: "auditoria-1",
        usuarioId: "usuario-1",
        acao: AcaoAuditoria.USUARIO_LOGIN,
        entidade: "Usuario",
        entidadeId: "usuario-1",
        metadata: null,
        criadoEm: new Date("2026-06-28T10:00:00.000Z"),
        usuario: {
          id: "usuario-1",
          nome: "Admin Raizes",
          email: "admin@raizes.local",
          perfil: PerfilUsuario.ADMIN,
          unidadeId: null,
        },
      },
    ];
    const prisma = criarPrismaMock(auditorias, 1);
    const service = new AuditoriasService(prisma as unknown as PrismaService);

    const resposta = await service.listar({ page: 1, limit: 10 });

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          usuario: {
            select: expect.not.objectContaining({ senhaHash: true }),
          },
        }),
      }),
    );
    expect(resposta.data[0].usuario).not.toHaveProperty("senhaHash");
  });

  it("sends all provided filters to Prisma where", async () => {
    const prisma = criarPrismaMock([], 0);
    const service = new AuditoriasService(prisma as unknown as PrismaService);

    await service.listar({
      page: 1,
      limit: 10,
      acao: AcaoAuditoria.ESTOQUE_MOVIMENTADO,
      entidade: "Estoque",
      usuarioId: "usuario-1",
    });

    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          acao: AcaoAuditoria.ESTOQUE_MOVIMENTADO,
          entidade: "Estoque",
          usuarioId: "usuario-1",
        },
      }),
    );
  });
});

function criarPrismaMock(auditorias: unknown[], total: number) {
  const prisma = {
    $transaction: vi.fn(),
    auditoria: {
      findMany: vi.fn().mockReturnValue("findMany-query"),
      count: vi.fn().mockReturnValue("count-query"),
    },
  };
  prisma.$transaction.mockResolvedValue([auditorias, total]);
  return prisma;
}
