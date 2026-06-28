import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProdutoResponseDto {
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
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;
}
