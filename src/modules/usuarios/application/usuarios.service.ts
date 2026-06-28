import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";

const usuarioSeguroSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  unidadeId: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listar(paginacao: PaginacaoDto) {
    const { page, limit } = paginacao;
    const skip = (page - 1) * limit;

    const [usuarios, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        select: usuarioSeguroSelect,
        orderBy: { criadoEm: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count(),
    ]);

    return criarRespostaPaginada(usuarios, page, limit, total);
  }
}
