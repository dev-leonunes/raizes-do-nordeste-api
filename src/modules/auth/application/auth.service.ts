import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AcaoAuditoria, PerfilUsuario, type Usuario } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { AtualizarFuncionarioDto } from "../../usuarios/api/dtos/atualizar-funcionario.dto";
import type { RegistrarFuncionarioDto } from "../../usuarios/api/dtos/registrar-funcionario.dto";
import type { LoginDto } from "../api/dtos/login.dto";
import type { RegistrarUsuarioDto } from "../api/dtos/registrar-usuario.dto";
import type { UsuarioAutenticado } from "../domain/usuario-autenticado";

type UsuarioSeguro = Omit<Usuario, "senhaHash">;

const perfisFuncionario: PerfilUsuario[] = [
  PerfilUsuario.ADMIN,
  PerfilUsuario.GERENTE,
  PerfilUsuario.ATENDENTE,
  PerfilUsuario.COZINHA,
];

const perfisGerenciaveisPorGerente: PerfilUsuario[] = [
  PerfilUsuario.ATENDENTE,
  PerfilUsuario.COZINHA,
];

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
        perfil: PerfilUsuario.CLIENTE,
        unidadeId: null,
      },
    });

    return this.criarRespostaAutenticada(this.removerSenhaHash(usuario));
  }

  async registrarFuncionario(dto: RegistrarFuncionarioDto, usuarioAtual: UsuarioAutenticado) {
    this.validarCriacaoFuncionario(dto, usuarioAtual);

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
        perfil: dto.perfil,
        unidadeId: this.obterUnidadeFuncionario(dto.unidadeId, usuarioAtual),
      },
    });

    return this.removerSenhaHash(usuario);
  }

  async atualizarFuncionario(
    id: string,
    dto: AtualizarFuncionarioDto,
    usuarioAtual: UsuarioAutenticado,
  ) {
    if (!dto.nome && !dto.perfil && dto.unidadeId === undefined) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException("Funcionário não encontrado.");
    }

    this.validarEdicaoFuncionario(usuario, dto, usuarioAtual);

    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(dto.nome ? { nome: dto.nome } : {}),
        ...(dto.perfil ? { perfil: dto.perfil } : {}),
        ...(dto.unidadeId !== undefined
          ? { unidadeId: this.obterUnidadeFuncionario(dto.unidadeId, usuarioAtual) }
          : {}),
      },
    });

    return this.removerSenhaHash(usuarioAtualizado);
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

  private validarCriacaoFuncionario(
    dto: RegistrarFuncionarioDto,
    usuarioAtual: UsuarioAutenticado,
  ) {
    if (!perfisFuncionario.includes(dto.perfil)) {
      throw new ForbiddenException("A rota de funcionários não cria usuários CLIENTE.");
    }

    if (usuarioAtual.perfil === PerfilUsuario.ADMIN) {
      return;
    }

    if (usuarioAtual.perfil !== PerfilUsuario.GERENTE) {
      throw new ForbiddenException("Perfil sem permissão para gerenciar funcionários.");
    }

    this.validarGerenteComUnidade(usuarioAtual);

    if (!perfisGerenciaveisPorGerente.includes(dto.perfil)) {
      throw new ForbiddenException("Gerente só pode criar ATENDENTE ou COZINHA.");
    }

    if (dto.unidadeId && dto.unidadeId !== usuarioAtual.unidadeId) {
      throw new ForbiddenException("Gerente só pode criar funcionários da própria unidade.");
    }
  }

  private validarEdicaoFuncionario(
    usuario: Usuario,
    dto: AtualizarFuncionarioDto,
    usuarioAtual: UsuarioAutenticado,
  ) {
    if (dto.perfil === PerfilUsuario.CLIENTE) {
      throw new ForbiddenException("A rota de funcionários não transforma usuários em CLIENTE.");
    }

    if (!perfisFuncionario.includes(usuario.perfil)) {
      throw new ForbiddenException("A rota de funcionários não edita clientes.");
    }

    if (usuarioAtual.perfil === PerfilUsuario.ADMIN) {
      return;
    }

    if (usuarioAtual.perfil !== PerfilUsuario.GERENTE) {
      throw new ForbiddenException("Perfil sem permissão para gerenciar funcionários.");
    }

    this.validarGerenteComUnidade(usuarioAtual);

    if (usuario.unidadeId !== usuarioAtual.unidadeId) {
      throw new ForbiddenException("Gerente só pode editar funcionários da própria unidade.");
    }

    if (!perfisGerenciaveisPorGerente.includes(usuario.perfil)) {
      throw new ForbiddenException("Gerente só pode editar ATENDENTE ou COZINHA.");
    }

    if (dto.perfil && !perfisGerenciaveisPorGerente.includes(dto.perfil)) {
      throw new ForbiddenException("Gerente só pode alternar perfil entre ATENDENTE e COZINHA.");
    }

    if (dto.unidadeId && dto.unidadeId !== usuarioAtual.unidadeId) {
      throw new ForbiddenException("Gerente não pode mover funcionário para outra unidade.");
    }
  }

  private validarGerenteComUnidade(usuarioAtual: UsuarioAutenticado) {
    if (!usuarioAtual.unidadeId) {
      throw new ForbiddenException(
        "Gerente sem unidade vinculada não pode gerenciar funcionários.",
      );
    }
  }

  private obterUnidadeFuncionario(unidadeId: string | undefined, usuarioAtual: UsuarioAutenticado) {
    if (usuarioAtual.perfil === PerfilUsuario.GERENTE) {
      return usuarioAtual.unidadeId;
    }

    return unidadeId ?? null;
  }
}
