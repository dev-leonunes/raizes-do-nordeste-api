import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class PagarPedidoMockDto {
  @ApiProperty()
  @IsBoolean()
  aprovado: boolean;
}
