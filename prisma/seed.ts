import { PerfilUsuario, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const unidadeSeedId = "11111111-1111-4111-8111-111111111111";
const produtoSeedId = "22222222-2222-4222-8222-222222222222";

async function main() {
  const senhaHash = await bcrypt.hash("Senha@123", 10);

  const unidade = await prisma.unidade.upsert({
    where: { id: unidadeSeedId },
    update: {},
    create: {
      id: unidadeSeedId,
      nome: "Raizes Recife Centro",
      cidade: "Recife",
      estado: "PE",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "admin@raizes.local" },
    update: {},
    create: {
      nome: "Admin Raizes",
      email: "admin@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cliente@raizes.local" },
    update: {},
    create: {
      nome: "Cliente Raizes",
      email: "cliente@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.CLIENTE,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "gerente@raizes.local" },
    update: {
      unidadeId: unidade.id,
    },
    create: {
      nome: "Gerente Raizes",
      email: "gerente@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.GERENTE,
      unidadeId: unidade.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "atendente@raizes.local" },
    update: {
      unidadeId: unidade.id,
    },
    create: {
      nome: "Atendente Raizes",
      email: "atendente@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.ATENDENTE,
      unidadeId: unidade.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cozinha@raizes.local" },
    update: {
      unidadeId: unidade.id,
    },
    create: {
      nome: "Cozinha Raizes",
      email: "cozinha@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.COZINHA,
      unidadeId: unidade.id,
    },
  });

  const produto = await prisma.produto.upsert({
    where: { id: produtoSeedId },
    update: {},
    create: {
      id: produtoSeedId,
      nome: "Cuscuz com queijo coalho",
      descricao: "Cuscuz nordestino com queijo coalho.",
      preco: "18.90",
    },
  });

  await prisma.estoque.upsert({
    where: {
      unidadeId_produtoId: {
        unidadeId: unidade.id,
        produtoId: produto.id,
      },
    },
    update: {
      quantidade: 50,
      quantidadeMinima: 5,
    },
    create: {
      unidadeId: unidade.id,
      produtoId: produto.id,
      quantidade: 50,
      quantidadeMinima: 5,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
