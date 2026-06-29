import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { UsuarioResponseDto } from "../../auth/api/dtos/usuario-response.dto";
import { Perfis } from "../../auth/decorators/perfis.decorator";
import { UsuarioAtual } from "../../auth/decorators/usuario-atual.decorator";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PerfisGuard } from "../../auth/guards/perfis.guard";
import { UsuariosService } from "../application/usuarios.service";
import { AtualizarFuncionarioDto } from "./dtos/atualizar-funcionario.dto";
import { RegistrarFuncionarioDto } from "./dtos/registrar-funcionario.dto";
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

  @Post("funcionarios")
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  @ApiOperation({ summary: "Cadastra funcionário com regras por perfil e unidade." })
  @ApiBody({ type: RegistrarFuncionarioDto })
  @ApiCreatedResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para cadastrar este funcionário." })
  @ApiUnprocessableEntityResponse({ description: "Dados de cadastro inválidos." })
  registrarFuncionario(
    @Body() dto: RegistrarFuncionarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.usuariosService.registrarFuncionario(dto, usuario);
  }

  @Patch("funcionarios/:id")
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  @ApiOperation({ summary: "Atualiza funcionário com regras por perfil e unidade." })
  @ApiBody({ type: AtualizarFuncionarioDto })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para atualizar este funcionário." })
  @ApiBadRequestResponse({ description: "Nenhum campo informado para atualização." })
  @ApiNotFoundResponse({ description: "Funcionário não encontrado." })
  @ApiUnprocessableEntityResponse({ description: "Dados de atualização inválidos." })
  atualizarFuncionario(
    @Param("id") id: string,
    @Body() dto: AtualizarFuncionarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.usuariosService.atualizarFuncionario(id, dto, usuario);
  }
}
