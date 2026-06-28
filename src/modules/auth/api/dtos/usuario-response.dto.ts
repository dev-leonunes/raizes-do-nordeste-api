import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PerfilUsuario } from "@prisma/client";

export class UsuarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: PerfilUsuario })
  perfil: PerfilUsuario;

  @ApiPropertyOptional()
  unidadeId: string | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;
}
