import { ApiProperty } from "@nestjs/swagger";
import { PedidoResponseDto } from "./pedido-response.dto";

class PedidosPaginadosMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class PedidosPaginadosResponseDto {
  @ApiProperty({ type: [PedidoResponseDto] })
  data: PedidoResponseDto[];

  @ApiProperty({ type: PedidosPaginadosMetaDto })
  meta: PedidosPaginadosMetaDto;
}
