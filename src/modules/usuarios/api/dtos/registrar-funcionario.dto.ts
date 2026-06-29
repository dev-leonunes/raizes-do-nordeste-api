import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class RegistrarFuncionarioDto {
  @ApiProperty({ example: "Atendente Recife" })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: "atendente.recife@raizes.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Senha@123", minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ enum: PerfilUsuario, example: PerfilUsuario.ATENDENTE })
  @IsEnum(PerfilUsuario)
  perfil: PerfilUsuario;

  @ApiPropertyOptional({ example: "11111111-1111-4111-8111-111111111111" })
  @IsOptional()
  @IsUUID()
  unidadeId?: string;
}
