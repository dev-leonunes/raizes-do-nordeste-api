import { ApiProperty } from "@nestjs/swagger";
import { UsuarioResponseDto } from "./usuario-response.dto";

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
