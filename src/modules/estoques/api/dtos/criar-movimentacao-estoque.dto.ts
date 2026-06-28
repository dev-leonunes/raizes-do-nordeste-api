import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoMovimentacaoEstoque } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

export class CriarMovimentacaoEstoqueDto {
  @ApiProperty()
  @IsUUID()
  unidadeId: string;

  @ApiProperty()
  @IsUUID()
  produtoId: string;

  @ApiProperty({ enum: TipoMovimentacaoEstoque })
  @IsEnum(TipoMovimentacaoEstoque)
  tipo: TipoMovimentacaoEstoque;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  motivo?: string;
}
