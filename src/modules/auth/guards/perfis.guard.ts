import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PerfilUsuario } from "@prisma/client";
import { PERFIS_METADATA_KEY } from "../decorators/perfis.decorator";
import type { UsuarioAutenticado } from "../domain/usuario-autenticado";

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisPermitidos = this.reflector.getAllAndOverride<PerfilUsuario[]>(
      PERFIS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!perfisPermitidos?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>();
    const usuario = request.user;

    return Boolean(usuario && perfisPermitidos.includes(usuario.perfil));
  }
}
