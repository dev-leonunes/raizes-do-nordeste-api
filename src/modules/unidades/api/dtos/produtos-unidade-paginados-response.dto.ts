import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class ProdutoUnidadeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  descricao: string | null;

  @ApiProperty()
  preco: number;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty()
  quantidadeDisponivel: number;
}

class MetaPaginacaoDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ProdutosUnidadePaginadosResponseDto {
  @ApiProperty({ type: [ProdutoUnidadeResponseDto] })
  data: ProdutoUnidadeResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
