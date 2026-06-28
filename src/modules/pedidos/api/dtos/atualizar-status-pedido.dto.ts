import { ApiProperty } from "@nestjs/swagger";
import { StatusPedido } from "@prisma/client";
import { IsEnum } from "class-validator";

export class AtualizarStatusPedidoDto {
  @ApiProperty({ enum: [StatusPedido.EM_PREPARO, StatusPedido.PRONTO, StatusPedido.ENTREGUE] })
  @IsEnum(StatusPedido, { message: "status deve ser um valor válido." })
  status: StatusPedido;
}
