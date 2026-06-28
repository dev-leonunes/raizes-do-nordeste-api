import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UnidadesService } from "../application/unidades.service";
import { ProdutosUnidadePaginadosResponseDto } from "./dtos/produtos-unidade-paginados-response.dto";
import { UnidadesPaginadasResponseDto } from "./dtos/unidades-paginadas-response.dto";

class UnidadeParamsDto {
  @IsUUID()
  unidadeId: string;
}

@ApiTags("Unidades")
@ApiBearerAuth()
@ApiExtraModels(PaginacaoDto)
@UseGuards(JwtAuthGuard)
@Controller("unidades")
export class UnidadesController {
  constructor(@Inject(UnidadesService) private readonly unidadesService: UnidadesService) {}

  @Get()
  @ApiOperation({ summary: "Lista unidades da rede." })
  @ApiOkResponse({ type: UnidadesPaginadasResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  listar(@Query() paginacao: PaginacaoDto) {
    return this.unidadesService.listar(paginacao);
  }

  @Get(":unidadeId/produtos")
  @ApiOperation({ summary: "Lista produtos ativos com estoque disponível na unidade." })
  @ApiParam({ name: "unidadeId", description: "ID da unidade." })
  @ApiOkResponse({ type: ProdutosUnidadePaginadosResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  @ApiNotFoundResponse({ description: "Unidade não encontrada." })
  listarProdutosDisponiveis(@Param() params: UnidadeParamsDto, @Query() paginacao: PaginacaoDto) {
    return this.unidadesService.listarProdutosDisponiveis(params.unidadeId, paginacao);
  }
}
