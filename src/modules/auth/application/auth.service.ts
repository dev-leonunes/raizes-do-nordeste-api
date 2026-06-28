import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AcaoAuditoria, PerfilUsuario, type Usuario } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { LoginDto } from "../api/dtos/login.dto";
import type { RegistrarUsuarioDto } from "../api/dtos/registrar-usuario.dto";
import type { UsuarioAutenticado } from "../domain/usuario-autenticado";

type UsuarioSeguro = Omit<Usuario, "senhaHash">;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistrarUsuarioDto) {
    const email = dto.email.toLowerCase().trim();
    const usuarioExistente = await this.prisma.usuario.findUnique({ where: { email } });

    if (usuarioExistente) {
      throw new ConflictException("E-mail já cadastrado.");
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email,
        senhaHash,
        perfil: dto.perfil ?? PerfilUsuario.CLIENTE,
        unidadeId: dto.unidadeId,
      },
    });

    return this.criarRespostaAutenticada(this.removerSenhaHash(usuario));
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    await this.prisma.auditoria.create({
      data: {
        usuarioId: usuario.id,
        acao: AcaoAuditoria.USUARIO_LOGIN,
        entidade: "Usuario",
        entidadeId: usuario.id,
      },
    });

    return this.criarRespostaAutenticada(this.removerSenhaHash(usuario));
  }

  async buscarUsuarioAtual(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new UnauthorizedException("Usuário autenticado não encontrado.");
    }

    return this.removerSenhaHash(usuario);
  }

  criarPayload(usuario: UsuarioSeguro): UsuarioAutenticado {
    return {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId,
    };
  }

  removerSenhaHash(usuario: Usuario): UsuarioSeguro {
    const { senhaHash: _senhaHash, ...usuarioSeguro } = usuario;
    return usuarioSeguro;
  }

  private async criarRespostaAutenticada(usuario: UsuarioSeguro) {
    const payload = this.criarPayload(usuario);

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario,
    };
  }
}
