import { type ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { UsuarioAutenticado } from "../domain/usuario-autenticado";

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado => {
    const request = context.switchToHttp().getRequest<{ user: UsuarioAutenticado }>();
    return request.user;
  },
);
