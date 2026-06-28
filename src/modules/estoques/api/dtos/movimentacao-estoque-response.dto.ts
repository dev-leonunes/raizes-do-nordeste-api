import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoMovimentacaoEstoque } from "@prisma/client";

class MovimentacaoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unidadeId: string;

  @ApiProperty()
  produtoId: string;

  @ApiProperty()
  criadoPorId: string | null;

  @ApiProperty({ enum: TipoMovimentacaoEstoque })
  tipo: TipoMovimentacaoEstoque;

  @ApiProperty()
  quantidade: number;

  @ApiPropertyOptional()
  motivo: string | null;

  @ApiProperty()
  criadoEm: Date;
}

class EstoqueAtualizadoDto {
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
}

export class MovimentacaoEstoqueResponseDto {
  @ApiProperty({ type: MovimentacaoDto })
  movimentacao: MovimentacaoDto;

  @ApiProperty({ type: EstoqueAtualizadoDto })
  estoque: EstoqueAtualizadoDto;
}
