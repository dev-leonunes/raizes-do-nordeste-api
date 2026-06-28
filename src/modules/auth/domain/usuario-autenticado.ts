import type { PerfilUsuario } from "@prisma/client";

export type UsuarioAutenticado = {
  id: string;
  email: string;
  perfil: PerfilUsuario;
  unidadeId: string | null;
};
