import { PerfilUsuario } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { AuthService } from "../../auth/application/auth.service";
import { UsuariosService } from "./usuarios.service";

describe("UsuariosService", () => {
  it("lists users without returning senhaHash", async () => {
    const usuarios = [
      {
        id: "usuario-1",
        nome: "Admin Raizes",
        email: "admin@raizes.local",
        perfil: PerfilUsuario.ADMIN,
        unidadeId: null,
        criadoEm: new Date("2026-06-27T10:00:00.000Z"),
        atualizadoEm: new Date("2026-06-27T10:00:00.000Z"),
      },
    ];
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([usuarios, 1]),
      usuario: {
        findMany: vi.fn().mockReturnValue("findMany-query"),
        count: vi.fn().mockReturnValue("count-query"),
      },
    };
    const service = new UsuariosService(
      prisma as unknown as PrismaService,
      {} as unknown as AuthService,
    );

    const resposta = await service.listar({ page: 1, limit: 10 });

    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ senhaHash: true }),
        skip: 0,
        take: 10,
      }),
    );
    expect(resposta.data[0]).not.toHaveProperty("senhaHash");
    expect(resposta.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });
});
