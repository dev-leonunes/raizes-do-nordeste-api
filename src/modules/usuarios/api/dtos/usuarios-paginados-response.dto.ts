import { ApiProperty } from "@nestjs/swagger";
import { UsuarioResponseDto } from "../../../auth/api/dtos/usuario-response.dto";

class MetaPaginacaoDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class UsuariosPaginadosResponseDto {
  @ApiProperty({ type: [UsuarioResponseDto] })
  data: UsuarioResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
