import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AcaoAuditoria, type Prisma, TipoMovimentacaoEstoque } from "@prisma/client";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import type { CriarMovimentacaoEstoqueDto } from "../api/dtos/criar-movimentacao-estoque.dto";
import type { ListarEstoquesDto } from "../api/dtos/listar-estoques.dto";

@Injectable()
export class EstoquesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listar(filtros: ListarEstoquesDto) {
    const { page, limit, unidadeId } = filtros;
    const skip = (page - 1) * limit;
    const where = unidadeId ? { unidadeId } : {};

    const [estoques, total] = await this.prisma.$transaction([
      this.prisma.estoque.findMany({
        where,
        select: {
          id: true,
          unidadeId: true,
          produtoId: true,
          quantidade: true,
          quantidadeMinima: true,
          criadoEm: true,
          atualizadoEm: true,
          unidade: { select: { id: true, nome: true } },
          produto: { select: { id: true, nome: true, preco: true, ativo: true } },
        },
        orderBy: [{ unidade: { nome: "asc" } }, { produto: { nome: "asc" } }],
        skip,
        take: limit,
      }),
      this.prisma.estoque.count({ where }),
    ]);

    return criarRespostaPaginada(
      estoques.map((estoque) => ({
        ...estoque,
        produto: {
          ...estoque.produto,
          preco: Number(estoque.produto.preco),
        },
      })),
      page,
      limit,
      total,
    );
  }

  async criarMovimentacao(dto: CriarMovimentacaoEstoqueDto, usuario: UsuarioAutenticado) {
    return this.prisma.$transaction(async (transacao) => {
      const [unidade, produto] = await Promise.all([
        transacao.unidade.findUnique({ where: { id: dto.unidadeId } }),
        transacao.produto.findUnique({ where: { id: dto.produtoId } }),
      ]);

      if (!unidade) {
        throw new NotFoundException("Unidade não encontrada.");
      }

      if (!produto) {
        throw new NotFoundException("Produto não encontrado.");
      }

      const estoque = await transacao.estoque.upsert({
        where: {
          unidadeId_produtoId: {
            unidadeId: dto.unidadeId,
            produtoId: dto.produtoId,
          },
        },
        update: {},
        create: {
          unidadeId: dto.unidadeId,
          produtoId: dto.produtoId,
          quantidade: 0,
        },
      });

      const novaQuantidade = this.calcularNovaQuantidade(estoque.quantidade, dto);

      const [estoqueAtualizado, movimentacao] = await Promise.all([
        transacao.estoque.update({
          where: { id: estoque.id },
          data: { quantidade: novaQuantidade },
          include: {
            unidade: { select: { id: true, nome: true } },
            produto: { select: { id: true, nome: true, preco: true, ativo: true } },
          },
        }),
        transacao.movimentacaoEstoque.create({
          data: {
            unidadeId: dto.unidadeId,
            produtoId: dto.produtoId,
            criadoPorId: usuario.id,
            tipo: dto.tipo,
            quantidade: dto.quantidade,
            motivo: dto.motivo,
          },
        }),
      ]);

      await transacao.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: AcaoAuditoria.ESTOQUE_MOVIMENTADO,
          entidade: "Estoque",
          entidadeId: estoqueAtualizado.id,
          metadata: {
            movimentacaoId: movimentacao.id,
            tipo: dto.tipo,
            quantidade: dto.quantidade,
            quantidadeAnterior: estoque.quantidade,
            quantidadeAtual: estoqueAtualizado.quantidade,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return {
        movimentacao,
        estoque: {
          ...estoqueAtualizado,
          produto: {
            ...estoqueAtualizado.produto,
            preco: Number(estoqueAtualizado.produto.preco),
          },
        },
      };
    });
  }

  private calcularNovaQuantidade(quantidadeAtual: number, dto: CriarMovimentacaoEstoqueDto) {
    if (dto.tipo === TipoMovimentacaoEstoque.ENTRADA) {
      return quantidadeAtual + dto.quantidade;
    }

    if (dto.tipo === TipoMovimentacaoEstoque.AJUSTE) {
      return dto.quantidade;
    }

    const novaQuantidade = quantidadeAtual - dto.quantidade;

    if (novaQuantidade < 0) {
      throw new ConflictException("Estoque insuficiente para realizar a saída.");
    }

    return novaQuantidade;
  }
}
