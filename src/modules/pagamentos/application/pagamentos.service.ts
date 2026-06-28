import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  AcaoAuditoria,
  MetodoPagamento,
  type Prisma,
  StatusPagamento,
  StatusPedido,
  TipoMovimentacaoEstoque,
} from "@prisma/client";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import type { PagarPedidoMockDto } from "../../pedidos/api/dtos/pagar-pedido-mock.dto";
import { validarAcessoAoPedido } from "../../pedidos/domain/pedido-acesso";
import {
  type PedidoComRelacoes,
  mapearPedido,
  pedidoInclude,
} from "../../pedidos/domain/pedido-presenter";

type PrismaTransacao = Prisma.TransactionClient;

@Injectable()
export class PagamentosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async pagarMock(id: string, dto: PagarPedidoMockDto, usuario: UsuarioAutenticado) {
    return this.prisma.$transaction(async (transacao) => {
      const pedido = await this.buscarPedidoParaPagamento(transacao, id, usuario);

      if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
        throw new ConflictException("Pedido não está aguardando pagamento.");
      }

      if (!dto.aprovado) {
        const pedidoAtualizado = await this.registrarPagamentoRecusado(transacao, pedido, usuario);
        return mapearPedido(pedidoAtualizado);
      }

      await this.validarEstoqueSuficiente(transacao, pedido.unidadeId, pedido.itens);
      const pedidoAtualizado = await this.registrarPagamentoAprovado(transacao, pedido, usuario);

      return mapearPedido(pedidoAtualizado);
    });
  }

  private async buscarPedidoParaPagamento(
    transacao: PrismaTransacao,
    id: string,
    usuario: UsuarioAutenticado,
  ) {
    const pedido = await transacao.pedido.findUnique({
      where: { id },
      include: pedidoInclude,
    });

    if (!pedido) {
      throw new NotFoundException("Pedido não encontrado.");
    }

    validarAcessoAoPedido(pedido, usuario);
    return pedido;
  }

  private async validarEstoqueSuficiente(
    transacao: PrismaTransacao,
    unidadeId: string,
    itens: Array<{ produtoId: string; quantidade: number }>,
  ) {
    const estoques = await transacao.estoque.findMany({
      where: {
        unidadeId,
        produtoId: { in: itens.map((item) => item.produtoId) },
      },
    });
    const estoquePorProduto = new Map(estoques.map((estoque) => [estoque.produtoId, estoque]));

    for (const item of itens) {
      const estoque = estoquePorProduto.get(item.produtoId);

      if (!estoque || estoque.quantidade < item.quantidade) {
        throw new ConflictException("Estoque insuficiente para pagar o pedido.");
      }
    }
  }

  private async registrarPagamentoRecusado(
    transacao: PrismaTransacao,
    pedido: PedidoComRelacoes,
    usuario: UsuarioAutenticado,
  ) {
    const pagamento = await transacao.pagamento.upsert({
      where: { pedidoId: pedido.id },
      update: {
        status: StatusPagamento.RECUSADO,
        payloadProvedor: { aprovado: false },
        pagoEm: null,
      },
      create: {
        pedidoId: pedido.id,
        metodo: MetodoPagamento.MOCK,
        status: StatusPagamento.RECUSADO,
        valor: pedido.valorTotal,
        referenciaExterna: this.gerarReferenciaPagamento(),
        payloadProvedor: { aprovado: false },
      },
    });

    const pedidoAtualizado = await transacao.pedido.update({
      where: { id: pedido.id },
      data: { status: StatusPedido.PAGAMENTO_RECUSADO },
      include: pedidoInclude,
    });

    await transacao.auditoria.create({
      data: {
        usuarioId: usuario.id,
        acao: AcaoAuditoria.PAGAMENTO_RECUSADO,
        entidade: "Pagamento",
        entidadeId: pagamento.id,
        metadata: {
          pedidoId: pedido.id,
          valor: Number(pedido.valorTotal),
        } satisfies Prisma.InputJsonObject,
      },
    });

    return pedidoAtualizado;
  }

  private async registrarPagamentoAprovado(
    transacao: PrismaTransacao,
    pedido: PedidoComRelacoes,
    usuario: UsuarioAutenticado,
  ) {
    const pagoEm = new Date();
    const pagamento = await transacao.pagamento.upsert({
      where: { pedidoId: pedido.id },
      update: {
        status: StatusPagamento.APROVADO,
        payloadProvedor: { aprovado: true },
        pagoEm,
      },
      create: {
        pedidoId: pedido.id,
        metodo: MetodoPagamento.MOCK,
        status: StatusPagamento.APROVADO,
        valor: pedido.valorTotal,
        referenciaExterna: this.gerarReferenciaPagamento(),
        payloadProvedor: { aprovado: true },
        pagoEm,
      },
    });

    for (const item of pedido.itens) {
      const estoque = await transacao.estoque.update({
        where: {
          unidadeId_produtoId: {
            unidadeId: pedido.unidadeId,
            produtoId: item.produtoId,
          },
        },
        data: { quantidade: { decrement: item.quantidade } },
      });

      const movimentacao = await transacao.movimentacaoEstoque.create({
        data: {
          unidadeId: pedido.unidadeId,
          produtoId: item.produtoId,
          criadoPorId: usuario.id,
          tipo: TipoMovimentacaoEstoque.SAIDA,
          quantidade: item.quantidade,
          motivo: `Pagamento aprovado do pedido ${pedido.codigo}.`,
        },
      });

      await transacao.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: AcaoAuditoria.ESTOQUE_MOVIMENTADO,
          entidade: "Estoque",
          entidadeId: estoque.id,
          metadata: {
            pedidoId: pedido.id,
            movimentacaoId: movimentacao.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          } satisfies Prisma.InputJsonObject,
        },
      });
    }

    const pedidoAtualizado = await transacao.pedido.update({
      where: { id: pedido.id },
      data: { status: StatusPedido.PAGO },
      include: pedidoInclude,
    });

    await transacao.auditoria.create({
      data: {
        usuarioId: usuario.id,
        acao: AcaoAuditoria.PAGAMENTO_APROVADO,
        entidade: "Pagamento",
        entidadeId: pagamento.id,
        metadata: {
          pedidoId: pedido.id,
          valor: Number(pedido.valorTotal),
        } satisfies Prisma.InputJsonObject,
      },
    });

    return pedidoAtualizado;
  }

  private gerarReferenciaPagamento() {
    return `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}
