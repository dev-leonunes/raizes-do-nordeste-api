import { ConflictException } from "@nestjs/common";
import { AcaoAuditoria, PerfilUsuario, TipoMovimentacaoEstoque } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { EstoquesService } from "./estoques.service";

const usuario: UsuarioAutenticado = {
  id: "usuario-1",
  email: "gerente@raizes.local",
  perfil: PerfilUsuario.GERENTE,
  unidadeId: "unidade-1",
};

const unidade = {
  id: "unidade-1",
  nome: "Raizes Recife Centro",
  cidade: "Recife",
  estado: "PE",
  ativa: true,
  criadoEm: new Date("2026-06-27T10:00:00.000Z"),
  atualizadoEm: new Date("2026-06-27T10:00:00.000Z"),
};

const produto = {
  id: "produto-1",
  nome: "Cuscuz",
  descricao: null,
  preco: { toString: () => "18.9" },
  ativo: true,
  criadoEm: new Date("2026-06-27T10:00:00.000Z"),
  atualizadoEm: new Date("2026-06-27T10:00:00.000Z"),
};

describe("EstoquesService", () => {
  it("rejects stock output when available quantity is insufficient", async () => {
    const transacao = criarTransacaoMock({ quantidadeAtual: 2 });
    const prisma = criarPrismaMock(transacao);
    const service = new EstoquesService(prisma as unknown as PrismaService);

    await expect(
      service.criarMovimentacao(
        {
          unidadeId: "unidade-1",
          produtoId: "produto-1",
          tipo: TipoMovimentacaoEstoque.SAIDA,
          quantidade: 3,
        },
        usuario,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transacao.estoque.update).not.toHaveBeenCalled();
    expect(transacao.movimentacaoEstoque.create).not.toHaveBeenCalled();
  });

  it("updates stock balance when movement is valid", async () => {
    const transacao = criarTransacaoMock({ quantidadeAtual: 5 });
    const prisma = criarPrismaMock(transacao);
    const service = new EstoquesService(prisma as unknown as PrismaService);

    const resposta = await service.criarMovimentacao(
      {
        unidadeId: "unidade-1",
        produtoId: "produto-1",
        tipo: TipoMovimentacaoEstoque.ENTRADA,
        quantidade: 7,
        motivo: "Reposição semanal",
      },
      usuario,
    );

    expect(transacao.estoque.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { quantidade: 12 },
      }),
    );
    expect(transacao.movimentacaoEstoque.create).toHaveBeenCalledWith({
      data: {
        unidadeId: "unidade-1",
        produtoId: "produto-1",
        criadoPorId: usuario.id,
        tipo: TipoMovimentacaoEstoque.ENTRADA,
        quantidade: 7,
        motivo: "Reposição semanal",
      },
    });
    expect(transacao.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: usuario.id,
        acao: AcaoAuditoria.ESTOQUE_MOVIMENTADO,
        entidade: "Estoque",
      }),
    });
    expect(resposta.estoque.quantidade).toBe(12);
  });

  it("sets stock balance when movement type is adjustment", async () => {
    const transacao = criarTransacaoMock({ quantidadeAtual: 20 });
    const prisma = criarPrismaMock(transacao);
    const service = new EstoquesService(prisma as unknown as PrismaService);

    const resposta = await service.criarMovimentacao(
      {
        unidadeId: "unidade-1",
        produtoId: "produto-1",
        tipo: TipoMovimentacaoEstoque.AJUSTE,
        quantidade: 8,
      },
      usuario,
    );

    expect(transacao.estoque.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { quantidade: 8 },
      }),
    );
    expect(resposta.estoque.quantidade).toBe(8);
  });
});

function criarPrismaMock(transacao: ReturnType<typeof criarTransacaoMock>) {
  return {
    $transaction: vi.fn((callback) => callback(transacao)),
  };
}

function criarTransacaoMock({ quantidadeAtual }: { quantidadeAtual: number }) {
  const estoqueBase = {
    id: "estoque-1",
    unidadeId: "unidade-1",
    produtoId: "produto-1",
    quantidade: quantidadeAtual,
    quantidadeMinima: 0,
    criadoEm: new Date("2026-06-27T10:00:00.000Z"),
    atualizadoEm: new Date("2026-06-27T10:00:00.000Z"),
  };

  return {
    unidade: {
      findUnique: vi.fn().mockResolvedValue(unidade),
    },
    produto: {
      findUnique: vi.fn().mockResolvedValue(produto),
    },
    estoque: {
      upsert: vi.fn().mockResolvedValue(estoqueBase),
      update: vi.fn(({ data }) =>
        Promise.resolve({
          ...estoqueBase,
          quantidade: data.quantidade,
          unidade: { id: unidade.id, nome: unidade.nome },
          produto,
        }),
      ),
    },
    movimentacaoEstoque: {
      create: vi.fn().mockResolvedValue({
        id: "movimentacao-1",
        unidadeId: "unidade-1",
        produtoId: "produto-1",
        criadoPorId: usuario.id,
        tipo: TipoMovimentacaoEstoque.ENTRADA,
        quantidade: 7,
        motivo: "Reposição semanal",
        criadoEm: new Date("2026-06-27T10:00:00.000Z"),
      }),
    },
    auditoria: {
      create: vi.fn().mockResolvedValue({ id: "auditoria-1" }),
    },
  };
}
