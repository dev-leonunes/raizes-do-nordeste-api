import { ApiPropertyOptional } from "@nestjs/swagger";
import { AcaoAuditoria } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginacaoDto } from "../../../../shared/api/paginacao.dto";

export class ListarAuditoriasDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: AcaoAuditoria })
  @IsOptional()
  @IsEnum(AcaoAuditoria, { message: "ação deve ser um valor válido." })
  acao?: AcaoAuditoria;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "entidade deve ser um texto." })
  entidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: "usuarioId deve ser um texto." })
  usuarioId?: string;
}
