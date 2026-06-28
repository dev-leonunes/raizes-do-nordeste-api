import { ApiProperty } from "@nestjs/swagger";
import { ProdutoResponseDto } from "./produto-response.dto";

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

export class ProdutosPaginadosResponseDto {
  @ApiProperty({ type: [ProdutoResponseDto] })
  data: ProdutoResponseDto[];

  @ApiProperty({ type: MetaPaginacaoDto })
  meta: MetaPaginacaoDto;
}
