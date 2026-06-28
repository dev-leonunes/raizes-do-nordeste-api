import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";

const unidadeSelect = {
  id: true,
  nome: true,
  cidade: true,
  estado: true,
  ativa: true,
} satisfies Prisma.UnidadeSelect;

@Injectable()
export class UnidadesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listar(paginacao: PaginacaoDto) {
    const { page, limit } = paginacao;
    const skip = (page - 1) * limit;

    const [unidades, total] = await this.prisma.$transaction([
      this.prisma.unidade.findMany({
        select: unidadeSelect,
        orderBy: { nome: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.unidade.count(),
    ]);

    return criarRespostaPaginada(unidades, page, limit, total);
  }

  async listarProdutosDisponiveis(unidadeId: string, paginacao: PaginacaoDto) {
    const { page, limit } = paginacao;
    const skip = (page - 1) * limit;
    const where = {
      unidadeId,
      quantidade: { gt: 0 },
      produto: { ativo: true },
    };

    const [estoques, total] = await this.prisma.$transaction([
      this.prisma.estoque.findMany({
        where,
        select: {
          quantidade: true,
          produto: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              preco: true,
              ativo: true,
            },
          },
        },
        orderBy: { produto: { nome: "asc" } },
        skip,
        take: limit,
      }),
      this.prisma.estoque.count({ where }),
    ]);

    const produtos = estoques.map((estoque) => ({
      ...estoque.produto,
      preco: Number(estoque.produto.preco),
      quantidadeDisponivel: estoque.quantidade,
    }));

    return criarRespostaPaginada(produtos, page, limit, total);
  }
}
