import { ApiProperty } from "@nestjs/swagger";

export class UnidadeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  cidade: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  ativa: boolean;
}
