import { ApiProperty } from "@nestjs/swagger";
import { AuditoriaResponseDto } from "./auditoria-response.dto";

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

export class AuditoriasPaginadasResponseDto {
  @ApiProperty({ type: [AuditoriaResponseDto] })
  data: AuditoriaResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
