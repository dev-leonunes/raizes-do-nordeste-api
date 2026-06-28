import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { PerfilUsuario, type Usuario } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import { AuthService } from "./auth.service";

const usuarioBase: Usuario = {
  id: "usuario-1",
  nome: "Cliente Raizes",
  email: "cliente@raizes.local",
  senhaHash: "hash",
  perfil: PerfilUsuario.CLIENTE,
  unidadeId: null,
  criadoEm: new Date("2026-06-27T10:00:00.000Z"),
  atualizadoEm: new Date("2026-06-27T10:00:00.000Z"),
};

type PrismaMock = {
  usuario: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  auditoria: {
    create: ReturnType<typeof vi.fn>;
  };
};

describe("AuthService", () => {
  let prisma: PrismaMock;
  let jwtService: Pick<JwtService, "signAsync">;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      usuario: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      auditoria: {
        create: vi.fn(),
      },
    };
    jwtService = {
      signAsync: vi.fn().mockResolvedValue("jwt-token"),
    };
    service = new AuthService(prisma as unknown as PrismaService, jwtService as JwtService);
  });

  it("registers a user with hashed password and never returns senhaHash", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      ...usuarioBase,
      email: "maria@raizes.local",
      senhaHash: "hashed-password",
    });

    const resposta = await service.registrar({
      nome: "Maria Cliente",
      email: "MARIA@RAIZES.LOCAL",
      senha: "Senha@123",
    });

    expect(prisma.usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "maria@raizes.local",
        senhaHash: expect.any(String),
        perfil: PerfilUsuario.CLIENTE,
      }),
    });
    const data = prisma.usuario.create.mock.calls[0][0].data;
    await expect(bcrypt.compare("Senha@123", data.senhaHash)).resolves.toBe(true);
    expect(resposta).toEqual({
      accessToken: "jwt-token",
      usuario: expect.not.objectContaining({ senhaHash: expect.any(String) }),
    });
  });

  it("rejects registration when email is already in use", async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase);

    await expect(
      service.registrar({
        nome: "Cliente Raizes",
        email: "cliente@raizes.local",
        senha: "Senha@123",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("logs in with valid credentials and signs a payload with perfil", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      senhaHash: await bcrypt.hash("Senha@123", 10),
    });
    prisma.auditoria.create.mockResolvedValue({});

    const resposta = await service.login({
      email: "CLIENTE@RAIZES.LOCAL",
      senha: "Senha@123",
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      id: usuarioBase.id,
      email: usuarioBase.email,
      perfil: PerfilUsuario.CLIENTE,
      unidadeId: null,
    });
    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: usuarioBase.id,
        acao: "USUARIO_LOGIN",
      }),
    });
    expect(resposta.usuario).not.toHaveProperty("senhaHash");
  });

  it("rejects login when password is invalid", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      senhaHash: await bcrypt.hash("Senha@123", 10),
    });

    await expect(
      service.login({
        email: "cliente@raizes.local",
        senha: "senha-errada",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns the current user without senhaHash", async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase);

    const usuario = await service.buscarUsuarioAtual(usuarioBase.id);

    expect(usuario).not.toHaveProperty("senhaHash");
    expect(usuario).toMatchObject({
      id: usuarioBase.id,
      email: usuarioBase.email,
      perfil: PerfilUsuario.CLIENTE,
    });
  });
});
