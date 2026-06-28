import { ApiPropertyOptional } from "@nestjs/swagger";
import { CanalPedido } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { PaginacaoDto } from "../../../../shared/api/paginacao.dto";

export class ListarPedidosDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: CanalPedido })
  @IsOptional()
  @IsEnum(CanalPedido, { message: "canalPedido deve ser um valor válido." })
  canalPedido?: CanalPedido;
}
