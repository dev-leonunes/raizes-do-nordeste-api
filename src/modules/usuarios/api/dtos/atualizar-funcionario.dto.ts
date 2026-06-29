import { ApiPropertyOptional } from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class AtualizarFuncionarioDto {
  @ApiPropertyOptional({ example: "Atendente Recife" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @ApiPropertyOptional({ enum: PerfilUsuario, example: PerfilUsuario.COZINHA })
  @IsOptional()
  @IsEnum(PerfilUsuario)
  perfil?: PerfilUsuario;

  @ApiPropertyOptional({ example: "11111111-1111-4111-8111-111111111111" })
  @IsOptional()
  @IsUUID()
  unidadeId?: string;
}
