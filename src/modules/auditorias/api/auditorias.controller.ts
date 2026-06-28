import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { Perfis } from "../../auth/decorators/perfis.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PerfisGuard } from "../../auth/guards/perfis.guard";
import { AuditoriasService } from "../application/auditorias.service";
import { AuditoriasPaginadasResponseDto } from "./dtos/auditorias-paginadas-response.dto";
import { ListarAuditoriasDto } from "./dtos/listar-auditorias.dto";

@ApiTags("Auditorias")
@ApiBearerAuth()
@ApiExtraModels(ListarAuditoriasDto)
@UseGuards(JwtAuthGuard, PerfisGuard)
@Controller("auditorias")
export class AuditoriasController {
  constructor(@Inject(AuditoriasService) private readonly auditoriasService: AuditoriasService) {}

  @Get()
  @Perfis(PerfilUsuario.ADMIN)
  @ApiOperation({ summary: "Lista registros de auditoria com filtros e paginação." })
  @ApiOkResponse({ type: AuditoriasPaginadasResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para consultar auditorias." })
  listar(@Query() filtros: ListarAuditoriasDto) {
    return this.auditoriasService.listar(filtros);
  }
}
