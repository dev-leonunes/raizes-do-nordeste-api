import { PerfilUsuario, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const unidadeSeedId = "11111111-1111-4111-8111-111111111111";
const produtoSeedId = "22222222-2222-4222-8222-222222222222";
const unidadeOlindaId = "33333333-3333-4333-8333-333333333333";
const unidadeFortalezaId = "44444444-4444-4444-8444-444444444444";
const unidadeSalvadorId = "99999999-9999-4999-8999-999999999911";
const produtoTapiocaId = "55555555-5555-4555-8555-555555555555";
const produtoBoloRoloId = "66666666-6666-4666-8666-666666666666";
const produtoSucoCajuId = "77777777-7777-4777-8777-777777777777";
const produtoBaiaoId = "88888888-8888-4888-8888-888888888888";

async function main() {
  const senhaHash = await bcrypt.hash("Senha@123", 10);

  const unidadeRecife = await prisma.unidade.upsert({
    where: { id: unidadeSeedId },
    update: {
      nome: "Raizes Recife Centro",
      cidade: "Recife",
      estado: "PE",
      ativa: true,
    },
    create: {
      id: unidadeSeedId,
      nome: "Raizes Recife Centro",
      cidade: "Recife",
      estado: "PE",
    },
  });

  const unidadeOlinda = await prisma.unidade.upsert({
    where: { id: unidadeOlindaId },
    update: {
      nome: "Raizes Olinda Carmo",
      cidade: "Olinda",
      estado: "PE",
      ativa: true,
    },
    create: {
      id: unidadeOlindaId,
      nome: "Raizes Olinda Carmo",
      cidade: "Olinda",
      estado: "PE",
    },
  });

  const unidadeFortaleza = await prisma.unidade.upsert({
    where: { id: unidadeFortalezaId },
    update: {
      nome: "Raizes Fortaleza Meireles",
      cidade: "Fortaleza",
      estado: "CE",
      ativa: true,
    },
    create: {
      id: unidadeFortalezaId,
      nome: "Raizes Fortaleza Meireles",
      cidade: "Fortaleza",
      estado: "CE",
    },
  });

  const unidadeSalvador = await prisma.unidade.upsert({
    where: { id: unidadeSalvadorId },
    update: {
      nome: "Raizes Salvador Rio Vermelho",
      cidade: "Salvador",
      estado: "BA",
      ativa: true,
    },
    create: {
      id: unidadeSalvadorId,
      nome: "Raizes Salvador Rio Vermelho",
      cidade: "Salvador",
      estado: "BA",
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
      unidadeId: unidadeRecife.id,
    },
    create: {
      nome: "Gerente Raizes",
      email: "gerente@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.GERENTE,
      unidadeId: unidadeRecife.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "atendente@raizes.local" },
    update: {
      unidadeId: unidadeRecife.id,
    },
    create: {
      nome: "Atendente Raizes",
      email: "atendente@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.ATENDENTE,
      unidadeId: unidadeRecife.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cozinha@raizes.local" },
    update: {
      unidadeId: unidadeRecife.id,
    },
    create: {
      nome: "Cozinha Raizes",
      email: "cozinha@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.COZINHA,
      unidadeId: unidadeRecife.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "gerente.olinda@raizes.local" },
    update: {
      unidadeId: unidadeOlinda.id,
    },
    create: {
      nome: "Gerente Olinda",
      email: "gerente.olinda@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.GERENTE,
      unidadeId: unidadeOlinda.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "atendente.fortaleza@raizes.local" },
    update: {
      unidadeId: unidadeFortaleza.id,
    },
    create: {
      nome: "Atendente Fortaleza",
      email: "atendente.fortaleza@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.ATENDENTE,
      unidadeId: unidadeFortaleza.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "gerente.salvador@raizes.local" },
    update: {
      unidadeId: unidadeSalvador.id,
    },
    create: {
      nome: "Gerente Salvador",
      email: "gerente.salvador@raizes.local",
      senhaHash,
      perfil: PerfilUsuario.GERENTE,
      unidadeId: unidadeSalvador.id,
    },
  });

  const cuscuz = await prisma.produto.upsert({
    where: { id: produtoSeedId },
    update: {
      nome: "Cuscuz com queijo coalho",
      descricao: "Cuscuz nordestino com queijo coalho.",
      preco: "18.90",
      ativo: true,
    },
    create: {
      id: produtoSeedId,
      nome: "Cuscuz com queijo coalho",
      descricao: "Cuscuz nordestino com queijo coalho.",
      preco: "18.90",
    },
  });

  const tapioca = await prisma.produto.upsert({
    where: { id: produtoTapiocaId },
    update: {
      nome: "Tapioca de carne de sol",
      descricao: "Tapioca recheada com carne de sol e queijo manteiga.",
      preco: "24.50",
      ativo: true,
    },
    create: {
      id: produtoTapiocaId,
      nome: "Tapioca de carne de sol",
      descricao: "Tapioca recheada com carne de sol e queijo manteiga.",
      preco: "24.50",
    },
  });

  const boloDeRolo = await prisma.produto.upsert({
    where: { id: produtoBoloRoloId },
    update: {
      nome: "Bolo de rolo",
      descricao: "Fatia de bolo de rolo com goiabada.",
      preco: "12.00",
      ativo: true,
    },
    create: {
      id: produtoBoloRoloId,
      nome: "Bolo de rolo",
      descricao: "Fatia de bolo de rolo com goiabada.",
      preco: "12.00",
    },
  });

  const sucoDeCaju = await prisma.produto.upsert({
    where: { id: produtoSucoCajuId },
    update: {
      nome: "Suco de caju",
      descricao: "Suco natural de caju.",
      preco: "9.90",
      ativo: true,
    },
    create: {
      id: produtoSucoCajuId,
      nome: "Suco de caju",
      descricao: "Suco natural de caju.",
      preco: "9.90",
    },
  });

  const baiaoDeDois = await prisma.produto.upsert({
    where: { id: produtoBaiaoId },
    update: {
      nome: "Baião de dois",
      descricao: "Porção individual de baião de dois com queijo coalho.",
      preco: "29.90",
      ativo: true,
    },
    create: {
      id: produtoBaiaoId,
      nome: "Baião de dois",
      descricao: "Porção individual de baião de dois com queijo coalho.",
      preco: "29.90",
    },
  });

  const estoques = [
    { unidadeId: unidadeRecife.id, produtoId: cuscuz.id, quantidade: 50, quantidadeMinima: 5 },
    { unidadeId: unidadeRecife.id, produtoId: tapioca.id, quantidade: 30, quantidadeMinima: 5 },
    { unidadeId: unidadeRecife.id, produtoId: boloDeRolo.id, quantidade: 20, quantidadeMinima: 4 },
    { unidadeId: unidadeRecife.id, produtoId: sucoDeCaju.id, quantidade: 40, quantidadeMinima: 8 },
    { unidadeId: unidadeOlinda.id, produtoId: cuscuz.id, quantidade: 25, quantidadeMinima: 5 },
    { unidadeId: unidadeOlinda.id, produtoId: boloDeRolo.id, quantidade: 12, quantidadeMinima: 4 },
    { unidadeId: unidadeOlinda.id, produtoId: baiaoDeDois.id, quantidade: 10, quantidadeMinima: 3 },
    { unidadeId: unidadeFortaleza.id, produtoId: tapioca.id, quantidade: 22, quantidadeMinima: 5 },
    {
      unidadeId: unidadeFortaleza.id,
      produtoId: sucoDeCaju.id,
      quantidade: 35,
      quantidadeMinima: 8,
    },
    {
      unidadeId: unidadeFortaleza.id,
      produtoId: baiaoDeDois.id,
      quantidade: 0,
      quantidadeMinima: 3,
    },
    { unidadeId: unidadeSalvador.id, produtoId: cuscuz.id, quantidade: 18, quantidadeMinima: 5 },
    { unidadeId: unidadeSalvador.id, produtoId: tapioca.id, quantidade: 16, quantidadeMinima: 5 },
    {
      unidadeId: unidadeSalvador.id,
      produtoId: sucoDeCaju.id,
      quantidade: 28,
      quantidadeMinima: 8,
    },
    {
      unidadeId: unidadeSalvador.id,
      produtoId: baiaoDeDois.id,
      quantidade: 14,
      quantidadeMinima: 3,
    },
  ];

  for (const estoque of estoques) {
    await prisma.estoque.upsert({
      where: {
        unidadeId_produtoId: {
          unidadeId: estoque.unidadeId,
          produtoId: estoque.produtoId,
        },
      },
      update: {
        quantidade: estoque.quantidade,
        quantidadeMinima: estoque.quantidadeMinima,
      },
      create: estoque,
    });
  }

  await prisma.auditoria.upsert({
    where: { id: "99999999-9999-4999-8999-999999999901" },
    update: {},
    create: {
      id: "99999999-9999-4999-8999-999999999901",
      usuarioId: null,
      acao: "ESTOQUE_MOVIMENTADO",
      entidade: "Seed",
      entidadeId: null,
      metadata: {
        descricao: "Carga inicial com unidades, produtos e estoques para demonstracao local.",
      },
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
