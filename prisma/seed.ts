import { PerfilUsuario, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("Senha@123", 10);

  const unidade = await prisma.unidade.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
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

  const produto = await prisma.produto.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
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
