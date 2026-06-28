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
import { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { Perfis } from "../../auth/decorators/perfis.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PerfisGuard } from "../../auth/guards/perfis.guard";
import { UsuariosService } from "../application/usuarios.service";
import { UsuariosPaginadosResponseDto } from "./dtos/usuarios-paginados-response.dto";

@ApiTags("Usuários")
@ApiBearerAuth()
@ApiExtraModels(PaginacaoDto)
@UseGuards(JwtAuthGuard, PerfisGuard)
@Controller("usuarios")
export class UsuariosController {
  constructor(@Inject(UsuariosService) private readonly usuariosService: UsuariosService) {}

  @Get()
  @Perfis(PerfilUsuario.ADMIN)
  @ApiOperation({ summary: "Lista usuários cadastrados." })
  @ApiOkResponse({ type: UsuariosPaginadosResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para listar usuários." })
  listar(@Query() paginacao: PaginacaoDto) {
    return this.usuariosService.listar(paginacao);
  }
}
