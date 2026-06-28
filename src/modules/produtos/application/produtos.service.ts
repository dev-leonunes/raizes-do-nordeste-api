import { Inject, Injectable } from "@nestjs/common";
import type { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";

@Injectable()
export class ProdutosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listar(paginacao: PaginacaoDto) {
    const { page, limit } = paginacao;
    const skip = (page - 1) * limit;

    const [produtos, total] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        select: {
          id: true,
          nome: true,
          descricao: true,
          preco: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
        orderBy: { nome: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.produto.count(),
    ]);

    return criarRespostaPaginada(
      produtos.map((produto) => ({ ...produto, preco: Number(produto.preco) })),
      page,
      limit,
      total,
    );
  }
}
