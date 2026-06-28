import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcaoAuditoria, PerfilUsuario } from "@prisma/client";

export class UsuarioAuditoriaResponseDto {
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
}

export class AuditoriaResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  usuarioId: string | null;

  @ApiProperty({ enum: AcaoAuditoria })
  acao: AcaoAuditoria;

  @ApiProperty()
  entidade: string;

  @ApiPropertyOptional()
  entidadeId: string | null;

  @ApiPropertyOptional()
  metadata: unknown;

  @ApiProperty()
  criadoEm: Date;

  @ApiPropertyOptional({ type: UsuarioAuditoriaResponseDto })
  usuario?: UsuarioAuditoriaResponseDto | null;
}
