import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { ListarAuditoriasDto } from "../api/dtos/listar-auditorias.dto";

const auditoriaUsuarioSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  unidadeId: true,
} satisfies Prisma.UsuarioSelect;

const auditoriaSelect = {
  id: true,
  usuarioId: true,
  acao: true,
  entidade: true,
  entidadeId: true,
  metadata: true,
  criadoEm: true,
  usuario: {
    select: auditoriaUsuarioSelect,
  },
} satisfies Prisma.AuditoriaSelect;

@Injectable()
export class AuditoriasService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listar(filtros: ListarAuditoriasDto) {
    const { page, limit } = filtros;
    const skip = (page - 1) * limit;
    const where = this.criarWhere(filtros);

    const [auditorias, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        where,
        select: auditoriaSelect,
        orderBy: { criadoEm: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return criarRespostaPaginada(auditorias, page, limit, total);
  }

  private criarWhere(filtros: ListarAuditoriasDto): Prisma.AuditoriaWhereInput {
    return {
      ...(filtros.acao ? { acao: filtros.acao } : {}),
      ...(filtros.entidade ? { entidade: filtros.entidade } : {}),
      ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
    };
  }
}
