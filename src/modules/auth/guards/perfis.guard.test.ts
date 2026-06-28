import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { PerfilUsuario } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERFIS_METADATA_KEY } from "../decorators/perfis.decorator";
import { PerfisGuard } from "./perfis.guard";

describe("PerfisGuard", () => {
  let reflector: Pick<Reflector, "getAllAndOverride">;
  let guard: PerfisGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new PerfisGuard(reflector as Reflector);
  });

  it("allows access when no perfil metadata is required", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

    expect(guard.canActivate(criarContexto(PerfilUsuario.CLIENTE))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      PERFIS_METADATA_KEY,
      expect.any(Array),
    );
  });

  it("allows access for an authorized perfil", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([
      PerfilUsuario.ADMIN,
      PerfilUsuario.GERENTE,
    ]);

    expect(guard.canActivate(criarContexto(PerfilUsuario.GERENTE))).toBe(true);
  });

  it("denies access for an unauthorized perfil", () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([PerfilUsuario.ADMIN]);

    expect(guard.canActivate(criarContexto(PerfilUsuario.CLIENTE))).toBe(false);
  });
});

function criarContexto(perfil: PerfilUsuario): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: "usuario-1",
          email: "usuario@raizes.local",
          perfil,
          unidadeId: null,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}
