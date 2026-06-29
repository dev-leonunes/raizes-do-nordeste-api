import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { PerfilUsuario, type Usuario } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { RegistrarUsuarioDto } from "../api/dtos/registrar-usuario.dto";
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

const adminAutenticado = {
  id: "admin-1",
  email: "admin@raizes.local",
  perfil: PerfilUsuario.ADMIN,
  unidadeId: null,
};

const gerenteAutenticado = {
  id: "gerente-1",
  email: "gerente@raizes.local",
  perfil: PerfilUsuario.GERENTE,
  unidadeId: "unidade-1",
};

type PrismaMock = {
  usuario: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
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
        update: vi.fn(),
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

  it("always registers public users as CLIENTE without unidadeId", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      ...usuarioBase,
      perfil: PerfilUsuario.CLIENTE,
      unidadeId: null,
    });

    const resposta = await service.registrar({
      nome: "Tentativa Admin",
      email: "admin.publico@raizes.local",
      senha: "Senha@123",
      perfil: PerfilUsuario.ADMIN,
      unidadeId: "unidade-1",
    } as RegistrarUsuarioDto & { perfil: PerfilUsuario; unidadeId: string });

    expect(prisma.usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        perfil: PerfilUsuario.CLIENTE,
        unidadeId: null,
      }),
    });
    expect(resposta.usuario).toMatchObject({
      perfil: PerfilUsuario.CLIENTE,
      unidadeId: null,
    });
    expect(resposta.usuario).not.toHaveProperty("senhaHash");
  });

  it("allows ADMIN to create employees with operational profiles", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil: PerfilUsuario.GERENTE,
      unidadeId: "unidade-2",
    });

    const resposta = await service.registrarFuncionario(
      {
        nome: "Gerente Olinda",
        email: "gerente.olinda@raizes.local",
        senha: "Senha@123",
        perfil: PerfilUsuario.GERENTE,
        unidadeId: "unidade-2",
      },
      adminAutenticado,
    );

    expect(prisma.usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        perfil: PerfilUsuario.GERENTE,
        unidadeId: "unidade-2",
      }),
    });
    expect(resposta).not.toHaveProperty("senhaHash");
  });

  it.each([
    PerfilUsuario.ADMIN,
    PerfilUsuario.GERENTE,
    PerfilUsuario.ATENDENTE,
    PerfilUsuario.COZINHA,
  ])("allows ADMIN to create %s employees", async (perfil) => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      ...usuarioBase,
      perfil,
      unidadeId: "unidade-2",
    });

    await service.registrarFuncionario(
      {
        nome: `Funcionario ${perfil}`,
        email: `${perfil.toLowerCase()}@raizes.local`,
        senha: "Senha@123",
        perfil,
        unidadeId: "unidade-2",
      },
      adminAutenticado,
    );

    expect(prisma.usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        perfil,
        unidadeId: "unidade-2",
      }),
    });
  });

  it.each([PerfilUsuario.ATENDENTE, PerfilUsuario.COZINHA])(
    "allows GERENTE to create %s in their own unit",
    async (perfil) => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({
        ...usuarioBase,
        perfil,
        unidadeId: "unidade-1",
      });

      await service.registrarFuncionario(
        {
          nome: `Funcionario ${perfil}`,
          email: `${perfil.toLowerCase()}@raizes.local`,
          senha: "Senha@123",
          perfil,
          unidadeId: "unidade-1",
        },
        gerenteAutenticado,
      );

      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          perfil,
          unidadeId: "unidade-1",
        }),
      });
    },
  );

  it("blocks GERENTE without unidadeId from creating employees", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.registrarFuncionario(
        {
          nome: "Atendente Sem Unidade",
          email: "atendente.sem.unidade@raizes.local",
          senha: "Senha@123",
          perfil: PerfilUsuario.ATENDENTE,
        },
        { ...gerenteAutenticado, unidadeId: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks GERENTE from creating privileged employees or employees in another unit", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.registrarFuncionario(
        {
          nome: "Novo Admin",
          email: "novo.admin@raizes.local",
          senha: "Senha@123",
          perfil: PerfilUsuario.ADMIN,
          unidadeId: "unidade-1",
        },
        {
          ...gerenteAutenticado,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.registrarFuncionario(
        {
          nome: "Atendente Outra Unidade",
          email: "atendente.outra@raizes.local",
          senha: "Senha@123",
          perfil: PerfilUsuario.ATENDENTE,
          unidadeId: "unidade-2",
        },
        {
          ...gerenteAutenticado,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("does not allow the employee route to create CLIENTE", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.registrarFuncionario(
        {
          nome: "Cliente Indevido",
          email: "cliente.funcionario@raizes.local",
          senha: "Senha@123",
          perfil: PerfilUsuario.CLIENTE,
        },
        adminAutenticado,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows ADMIN to update employee profile and unit without exposing senhaHash", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil: PerfilUsuario.ATENDENTE,
      unidadeId: "unidade-1",
    });
    prisma.usuario.update.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil: PerfilUsuario.GERENTE,
      unidadeId: "unidade-2",
    });

    const resposta = await service.atualizarFuncionario(
      "funcionario-1",
      { perfil: PerfilUsuario.GERENTE, unidadeId: "unidade-2" },
      adminAutenticado,
    );

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "funcionario-1" },
      data: { perfil: PerfilUsuario.GERENTE, unidadeId: "unidade-2" },
    });
    expect(resposta).not.toHaveProperty("senhaHash");
  });

  it("allows ADMIN to promote GERENTE to ADMIN", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      id: "gerente-2",
      perfil: PerfilUsuario.GERENTE,
      unidadeId: "unidade-2",
    });
    prisma.usuario.update.mockResolvedValue({
      ...usuarioBase,
      id: "gerente-2",
      perfil: PerfilUsuario.ADMIN,
      unidadeId: "unidade-2",
    });

    const resposta = await service.atualizarFuncionario(
      "gerente-2",
      { perfil: PerfilUsuario.ADMIN },
      adminAutenticado,
    );

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "gerente-2" },
      data: { perfil: PerfilUsuario.ADMIN },
    });
    expect(resposta.perfil).toBe(PerfilUsuario.ADMIN);
  });

  it.each([
    [PerfilUsuario.ATENDENTE, PerfilUsuario.COZINHA],
    [PerfilUsuario.COZINHA, PerfilUsuario.ATENDENTE],
  ])("allows GERENTE to change %s to %s in their own unit", async (perfilAtual, novoPerfil) => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil: perfilAtual,
      unidadeId: "unidade-1",
    });
    prisma.usuario.update.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil: novoPerfil,
      unidadeId: "unidade-1",
    });

    await service.atualizarFuncionario("funcionario-1", { perfil: novoPerfil }, gerenteAutenticado);

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "funcionario-1" },
      data: { perfil: novoPerfil },
    });
  });

  it.each([
    ["ADMIN", PerfilUsuario.ADMIN, "unidade-1", { nome: "Admin Editado" }],
    ["GERENTE", PerfilUsuario.GERENTE, "unidade-1", { nome: "Gerente Editado" }],
    ["outra unidade", PerfilUsuario.ATENDENTE, "unidade-2", { nome: "Atendente Editado" }],
    [
      "promocao para GERENTE",
      PerfilUsuario.ATENDENTE,
      "unidade-1",
      { perfil: PerfilUsuario.GERENTE },
    ],
    ["promocao para ADMIN", PerfilUsuario.ATENDENTE, "unidade-1", { perfil: PerfilUsuario.ADMIN }],
  ])("blocks GERENTE from editing %s", async (_cenario, perfil, unidadeId, dto) => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      id: "funcionario-1",
      perfil,
      unidadeId,
    });

    await expect(
      service.atualizarFuncionario("funcionario-1", dto, gerenteAutenticado),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks GERENTE from editing users outside allowed employee scope", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioBase,
      id: "cliente-1",
      perfil: PerfilUsuario.CLIENTE,
      unidadeId: null,
    });

    await expect(
      service.atualizarFuncionario(
        "cliente-1",
        { perfil: PerfilUsuario.ATENDENTE },
        {
          ...gerenteAutenticado,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns not found when employee update target does not exist", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.atualizarFuncionario("usuario-inexistente", { nome: "Novo Nome" }, adminAutenticado),
    ).rejects.toBeInstanceOf(NotFoundException);
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
