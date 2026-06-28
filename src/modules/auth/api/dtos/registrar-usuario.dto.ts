import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class RegistrarUsuarioDto {
  @ApiProperty({ example: "Maria Cliente" })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: "maria@raizes.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Senha@123", minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiPropertyOptional({ enum: PerfilUsuario, default: PerfilUsuario.CLIENTE })
  @IsOptional()
  @IsEnum(PerfilUsuario)
  perfil?: PerfilUsuario;

  @ApiPropertyOptional({ example: "00000000-0000-0000-0000-000000000001" })
  @IsOptional()
  @IsUUID()
  unidadeId?: string;
}
