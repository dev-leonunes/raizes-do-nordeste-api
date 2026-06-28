import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CanalPedido, MetodoPagamento, StatusPagamento, StatusPedido } from "@prisma/client";

export class ProdutoPedidoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

export class ItemPedidoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  produtoId: string;

  @ApiProperty()
  quantidade: number;

  @ApiProperty()
  precoUnitario: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty({ type: ProdutoPedidoResponseDto })
  produto: ProdutoPedidoResponseDto;
}

export class PagamentoPedidoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: MetodoPagamento })
  metodo: MetodoPagamento;

  @ApiProperty({ enum: StatusPagamento })
  status: StatusPagamento;

  @ApiProperty()
  valor: number;

  @ApiPropertyOptional()
  referenciaExterna: string | null;

  @ApiPropertyOptional()
  pagoEm: Date | null;
}

export class PedidoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  clienteId: string;

  @ApiProperty()
  unidadeId: string;

  @ApiProperty({ enum: CanalPedido })
  canalPedido: CanalPedido;

  @ApiProperty({ enum: StatusPedido })
  status: StatusPedido;

  @ApiProperty()
  valorTotal: number;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  itens: ItemPedidoResponseDto[];

  @ApiPropertyOptional({ type: PagamentoPedidoResponseDto })
  pagamento?: PagamentoPedidoResponseDto | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  @ApiPropertyOptional()
  canceladoEm: Date | null;
}
