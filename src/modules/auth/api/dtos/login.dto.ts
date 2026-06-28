import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "cliente@raizes.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Senha@123", minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;
}
