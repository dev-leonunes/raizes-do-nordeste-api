import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { PaginacaoDto } from "../../../shared/api/paginacao.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ProdutosService } from "../application/produtos.service";
import { ProdutosPaginadosResponseDto } from "./dtos/produtos-paginados-response.dto";

@ApiTags("Produtos")
@ApiBearerAuth()
@ApiExtraModels(PaginacaoDto)
@UseGuards(JwtAuthGuard)
@Controller("produtos")
export class ProdutosController {
  constructor(@Inject(ProdutosService) private readonly produtosService: ProdutosService) {}

  @Get()
  @ApiOperation({ summary: "Lista produtos do cardápio geral." })
  @ApiOkResponse({ type: ProdutosPaginadosResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  listar(@Query() paginacao: PaginacaoDto) {
    return this.produtosService.listar(paginacao);
  }
}
