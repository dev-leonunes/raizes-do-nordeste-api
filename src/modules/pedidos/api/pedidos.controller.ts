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
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { Perfis } from "../../auth/decorators/perfis.decorator";
import { UsuarioAtual } from "../../auth/decorators/usuario-atual.decorator";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PerfisGuard } from "../../auth/guards/perfis.guard";
import { PagamentosService } from "../../pagamentos/application/pagamentos.service";
import { PedidosService } from "../application/pedidos.service";
import { AtualizarStatusPedidoDto } from "./dtos/atualizar-status-pedido.dto";
import { CriarPedidoDto } from "./dtos/criar-pedido.dto";
import { ListarPedidosDto } from "./dtos/listar-pedidos.dto";
import { PagarPedidoMockDto } from "./dtos/pagar-pedido-mock.dto";
import { PedidoResponseDto } from "./dtos/pedido-response.dto";
import { PedidosPaginadosResponseDto } from "./dtos/pedidos-paginados-response.dto";

@ApiTags("Pedidos")
@ApiBearerAuth()
@ApiExtraModels(ListarPedidosDto)
@UseGuards(JwtAuthGuard, PerfisGuard)
@Controller("pedidos")
export class PedidosController {
  constructor(
    @Inject(PedidosService) private readonly pedidosService: PedidosService,
    @Inject(PagamentosService) private readonly pagamentosService: PagamentosService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Cria pedido para o usuário autenticado." })
  @ApiBody({ type: CriarPedidoDto })
  @ApiCreatedResponse({ type: PedidoResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiNotFoundResponse({ description: "Unidade ou produto não encontrado." })
  @ApiConflictResponse({ description: "Estoque insuficiente para criar o pedido." })
  @ApiUnprocessableEntityResponse({ description: "Dados do pedido inválidos." })
  criar(@Body() dto: CriarPedidoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.pedidosService.criar(dto, usuario);
  }

  @Get()
  @ApiOperation({ summary: "Lista pedidos conforme perfil e unidade do usuário." })
  @ApiOkResponse({ type: PedidosPaginadosResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  listar(@Query() filtros: ListarPedidosDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.pedidosService.listar(filtros, usuario);
  }

  @Get(":id")
  @ApiOperation({ summary: "Busca um pedido detalhado." })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Usuário sem permissão para acessar o pedido." })
  @ApiNotFoundResponse({ description: "Pedido não encontrado." })
  buscarPorId(@Param("id") id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.pedidosService.buscarPorId(id, usuario);
  }

  @Post(":id/pagamentos/mock")
  @ApiOperation({ summary: "Simula pagamento mock aprovado ou recusado." })
  @ApiBody({ type: PagarPedidoMockDto })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Usuário sem permissão para pagar o pedido." })
  @ApiNotFoundResponse({ description: "Pedido não encontrado." })
  @ApiConflictResponse({
    description: "Pedido não está aguardando pagamento ou estoque insuficiente.",
  })
  pagarMock(
    @Param("id") id: string,
    @Body() dto: PagarPedidoMockDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.pagamentosService.pagarMock(id, dto, usuario);
  }

  @Patch(":id/status")
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE, PerfilUsuario.COZINHA)
  @ApiOperation({ summary: "Atualiza o status operacional do pedido." })
  @ApiBody({ type: AtualizarStatusPedidoDto })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Perfil sem permissão para atualizar status do pedido." })
  @ApiNotFoundResponse({ description: "Pedido não encontrado." })
  @ApiConflictResponse({ description: "Transição de status do pedido inválida." })
  atualizarStatus(
    @Param("id") id: string,
    @Body() dto: AtualizarStatusPedidoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.pedidosService.atualizarStatus(id, dto, usuario);
  }

  @Post(":id/cancelar")
  @ApiOperation({ summary: "Cancela um pedido quando permitido pelas regras de acesso." })
  @ApiOkResponse({ type: PedidoResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiForbiddenResponse({ description: "Usuário sem permissão para cancelar o pedido." })
  @ApiNotFoundResponse({ description: "Pedido não encontrado." })
  @ApiConflictResponse({ description: "Pedido entregue não pode ser cancelado." })
  cancelar(@Param("id") id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.pedidosService.cancelar(id, usuario);
  }
}
