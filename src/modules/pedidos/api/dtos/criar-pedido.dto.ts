import { ApiProperty } from "@nestjs/swagger";
import { CanalPedido } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsUUID, Min, ValidateNested } from "class-validator";

export class CriarItemPedidoDto {
  @ApiProperty()
  @IsUUID()
  produtoId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CriarPedidoDto {
  @ApiProperty()
  @IsUUID()
  unidadeId: string;

  @ApiProperty({ enum: CanalPedido })
  @IsEnum(CanalPedido, { message: "canalPedido deve ser um valor válido." })
  canalPedido: CanalPedido;

  @ApiProperty({ type: [CriarItemPedidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriarItemPedidoDto)
  itens: CriarItemPedidoDto[];
}
