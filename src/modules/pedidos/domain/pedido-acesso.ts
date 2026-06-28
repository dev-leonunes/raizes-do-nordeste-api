import { ForbiddenException } from "@nestjs/common";
import { PerfilUsuario } from "@prisma/client";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import type { PedidoComRelacoes } from "./pedido-presenter";

export function validarAcessoAoPedido(pedido: PedidoComRelacoes, usuario: UsuarioAutenticado) {
  if (usuario.perfil === PerfilUsuario.ADMIN) {
    return;
  }

  if (usuario.perfil === PerfilUsuario.CLIENTE) {
    if (pedido.clienteId === usuario.id) {
      return;
    }

    throw new ForbiddenException("Você não tem permissão para acessar este pedido.");
  }

  if (usuario.unidadeId && pedido.unidadeId === usuario.unidadeId) {
    return;
  }

  throw new ForbiddenException("Você não tem permissão para acessar este pedido.");
}
