import { ApiProperty } from "@nestjs/swagger";

class EstoqueUnidadeResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

class EstoqueProdutoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  preco: number;

  @ApiProperty()
  ativo: boolean;
}

class EstoqueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unidadeId: string;

  @ApiProperty()
  produtoId: string;

  @ApiProperty()
  quantidade: number;

  @ApiProperty()
  quantidadeMinima: number;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  @ApiProperty({ type: EstoqueUnidadeResumoDto })
  unidade: EstoqueUnidadeResumoDto;

  @ApiProperty({ type: EstoqueProdutoResumoDto })
  produto: EstoqueProdutoResumoDto;
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

export class EstoquesPaginadosResponseDto {
  @ApiProperty({ type: [EstoqueResponseDto] })
  data: EstoqueResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
