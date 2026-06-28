import { Body, Controller, Get, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthService } from "../application/auth.service";
import { UsuarioAtual } from "../decorators/usuario-atual.decorator";
import type { UsuarioAutenticado } from "../domain/usuario-autenticado";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthResponseDto } from "./dtos/auth-response.dto";
import { LoginDto } from "./dtos/login.dto";
import { RegistrarUsuarioDto } from "./dtos/registrar-usuario.dto";
import { UsuarioResponseDto } from "./dtos/usuario-response.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("registrar")
  @ApiOperation({ summary: "Registra um usuário e retorna token JWT." })
  @ApiBody({ type: RegistrarUsuarioDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiUnprocessableEntityResponse({ description: "Dados de cadastro inválidos." })
  registrar(@Body() dto: RegistrarUsuarioDto) {
    return this.authService.registrar(dto);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Autentica usuário por e-mail e senha." })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "Credenciais inválidas." })
  @ApiUnprocessableEntityResponse({ description: "Dados de login inválidos." })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retorna o usuário autenticado." })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: "Token ausente ou inválido." })
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.authService.buscarUsuarioAtual(usuario.id);
  }
}
