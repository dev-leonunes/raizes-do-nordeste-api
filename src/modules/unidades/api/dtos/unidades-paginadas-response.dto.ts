import { ApiProperty } from "@nestjs/swagger";
import { UnidadeResponseDto } from "./unidade-response.dto";

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

export class UnidadesPaginadasResponseDto {
  @ApiProperty({ type: [UnidadeResponseDto] })
  data: UnidadeResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
