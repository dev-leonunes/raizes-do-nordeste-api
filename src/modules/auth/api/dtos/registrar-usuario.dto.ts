import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

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
}
