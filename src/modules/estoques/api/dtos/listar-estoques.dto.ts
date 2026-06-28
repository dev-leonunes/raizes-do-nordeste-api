import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { PaginacaoDto } from "../../../../shared/api/paginacao.dto";

export class ListarEstoquesDto extends PaginacaoDto {
  @ApiPropertyOptional({ description: "Filtra estoques por unidade." })
  @IsOptional()
  @IsUUID()
  unidadeId?: string;
}
