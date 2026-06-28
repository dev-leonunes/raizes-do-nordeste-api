import { SetMetadata } from "@nestjs/common";
import type { PerfilUsuario } from "@prisma/client";

export const PERFIS_METADATA_KEY = "perfis";

export const Perfis = (...perfis: PerfilUsuario[]) => SetMetadata(PERFIS_METADATA_KEY, perfis);
