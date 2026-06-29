import { Body, Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { Perfis } from "../../auth/decorators/perfis.decorator";
import { UsuarioAtual } from "../../auth/decorators/usuario-atual.decorator";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PerfisGuard } from "../../auth/guards/perfis.guard";
import { EstoquesService } from "../application/estoques.service";
import { CriarMovimentacaoEstoqueDto } from "./dtos/criar-movimentacao-estoque.dto";
import { EstoquesPaginadosResponseDto } from "./dtos/estoques-paginados-response.dto";
import { ListarEstoquesDto } from "./dtos/listar-estoques.dto";
import { MovimentacaoEstoqueResponseDto } from "./dtos/movimentacao-estoque-response.dto";

@ApiTags("Estoques")
@ApiBearerAuth()
@ApiExtraModels(ListarEstoquesDto)
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
@Controller("estoques")
export class EstoquesController {
  constructor(@Inject(EstoquesService) private readonly estoquesService: EstoquesService) {}

  @Get()
  @ApiOperation({ summary: "Lista saldos de estoque por unidade e produto." })
  @ApiOkResponse({ type: EstoquesPaginadosResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para consultar estoques." })
  listar(@Query() filtros: ListarEstoquesDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.estoquesService.listar(filtros, usuario);
  }

  @Post("movimentacoes")
  @ApiOperation({ summary: "Cria movimentação de estoque e atualiza o saldo." })
  @ApiBody({ type: CriarMovimentacaoEstoqueDto })
  @ApiCreatedResponse({ type: MovimentacaoEstoqueResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para movimentar estoque." })
  @ApiNotFoundResponse({ description: "Unidade ou produto não encontrado." })
  @ApiConflictResponse({ description: "Estoque insuficiente para realizar a saída." })
  criarMovimentacao(
    @Body() dto: CriarMovimentacaoEstoqueDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.estoquesService.criarMovimentacao(dto, usuario);
  }
}
