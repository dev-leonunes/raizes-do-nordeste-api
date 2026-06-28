import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AcaoAuditoria,
  type CanalPedido,
  PerfilUsuario,
  type Prisma,
  StatusPedido,
} from "@prisma/client";
import { criarRespostaPaginada } from "../../../shared/application/paginacao";
import { podeTransicionarStatusPedido } from "../../../shared/domain/status-pedido";
import { PrismaService } from "../../../shared/infrastructure/prisma/prisma.service";
import type { UsuarioAutenticado } from "../../auth/domain/usuario-autenticado";
import type { AtualizarStatusPedidoDto } from "../api/dtos/atualizar-status-pedido.dto";
import type { CriarPedidoDto } from "../api/dtos/criar-pedido.dto";
import type { ListarPedidosDto } from "../api/dtos/listar-pedidos.dto";
import { validarAcessoAoPedido } from "../domain/pedido-acesso";
import { mapearPedido, pedidoInclude } from "../domain/pedido-presenter";

type PrismaTransacao = Prisma.TransactionClient;

@Injectable()
export class PedidosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async criar(dto: CriarPedidoDto, usuario: UsuarioAutenticado) {
    this.validarItensUnicos(dto);

    return this.prisma.$transaction(async (transacao) => {
      const unidade = await transacao.unidade.findUnique({ where: { id: dto.unidadeId } });

      if (!unidade) {
        throw new NotFoundException("Unidade não encontrada.");
      }

      const produtosIds = dto.itens.map((item) => item.produtoId);
      const produtos = await transacao.produto.findMany({
        where: { id: { in: produtosIds }, ativo: true },
      });

      if (produtos.length !== produtosIds.length) {
        throw new NotFoundException("Produto não encontrado ou inativo.");
      }

      await this.validarEstoqueSuficiente(transacao, dto.unidadeId, dto.itens);

      const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
      const itens = dto.itens.map((item) => {
        const produto = produtosPorId.get(item.produtoId);
        const precoUnitario = Number(produto?.preco ?? 0);
        const subtotal = precoUnitario * item.quantidade;

        return {
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario,
          subtotal,
        };
      });
      const valorTotal = itens.reduce((total, item) => total + item.subtotal, 0);

      const pedido = await transacao.pedido.create({
        data: {
          codigo: this.gerarCodigoPedido(),
          clienteId: usuario.id,
          unidadeId: dto.unidadeId,
          canalPedido: dto.canalPedido,
          status: StatusPedido.AGUARDANDO_PAGAMENTO,
          valorTotal,
          itens: { create: itens },
        },
        include: pedidoInclude,
      });

      await transacao.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: AcaoAuditoria.PEDIDO_CRIADO,
          entidade: "Pedido",
          entidadeId: pedido.id,
          metadata: {
            codigo: pedido.codigo,
            unidadeId: pedido.unidadeId,
            canalPedido: pedido.canalPedido,
            valorTotal,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return mapearPedido(pedido);
    });
  }

  async listar(filtros: ListarPedidosDto, usuario: UsuarioAutenticado) {
    const { page, limit, canalPedido } = filtros;
    const skip = (page - 1) * limit;
    const where = this.criarFiltroAcesso(usuario, canalPedido);

    const [pedidos, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({
        where,
        include: pedidoInclude,
        orderBy: { criadoEm: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return criarRespostaPaginada(
      pedidos.map((pedido) => mapearPedido(pedido)),
      page,
      limit,
      total,
    );
  }

  async buscarPorId(id: string, usuario: UsuarioAutenticado) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: pedidoInclude,
    });

    if (!pedido) {
      throw new NotFoundException("Pedido não encontrado.");
    }

    validarAcessoAoPedido(pedido, usuario);

    return mapearPedido(pedido);
  }

  async atualizarStatus(id: string, dto: AtualizarStatusPedidoDto, usuario: UsuarioAutenticado) {
    return this.prisma.$transaction(async (transacao) => {
      const pedido = await this.buscarPedidoParaOperacao(transacao, id, usuario);

      if (!podeTransicionarStatusPedido(pedido.status, dto.status)) {
        throw new ConflictException("Transição de status do pedido inválida.");
      }

      const statusManuaisPermitidos: StatusPedido[] = [
        StatusPedido.EM_PREPARO,
        StatusPedido.PRONTO,
        StatusPedido.ENTREGUE,
      ];

      if (!statusManuaisPermitidos.includes(dto.status)) {
        throw new UnprocessableEntityException("Status não permitido para atualização manual.");
      }

      const pedidoAtualizado = await transacao.pedido.update({
        where: { id },
        data: { status: dto.status },
        include: pedidoInclude,
      });

      await transacao.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: AcaoAuditoria.STATUS_PEDIDO_ATUALIZADO,
          entidade: "Pedido",
          entidadeId: id,
          metadata: {
            statusAnterior: pedido.status,
            statusAtual: dto.status,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return mapearPedido(pedidoAtualizado);
    });
  }

  async cancelar(id: string, usuario: UsuarioAutenticado) {
    return this.prisma.$transaction(async (transacao) => {
      const pedido = await this.buscarPedidoParaCancelamento(transacao, id, usuario);

      if (pedido.status === StatusPedido.ENTREGUE) {
        throw new ConflictException("Pedido entregue não pode ser cancelado.");
      }

      const pedidoAtualizado = await transacao.pedido.update({
        where: { id },
        data: { status: StatusPedido.CANCELADO, canceladoEm: new Date() },
        include: pedidoInclude,
      });

      await transacao.auditoria.create({
        data: {
          usuarioId: usuario.id,
          acao: AcaoAuditoria.PEDIDO_CANCELADO,
          entidade: "Pedido",
          entidadeId: id,
          metadata: {
            statusAnterior: pedido.status,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return mapearPedido(pedidoAtualizado);
    });
  }

  private async buscarPedidoParaOperacao(
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

  private async buscarPedidoParaCancelamento(
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

    if (usuario.perfil === PerfilUsuario.ADMIN) {
      return pedido;
    }

    if (usuario.perfil === PerfilUsuario.GERENTE && usuario.unidadeId === pedido.unidadeId) {
      return pedido;
    }

    if (usuario.perfil === PerfilUsuario.CLIENTE && pedido.clienteId === usuario.id) {
      return pedido;
    }

    throw new ForbiddenException("Você não tem permissão para cancelar este pedido.");
  }

  private criarFiltroAcesso(
    usuario: UsuarioAutenticado,
    canalPedido?: CanalPedido,
  ): Prisma.PedidoWhereInput {
    const where: Prisma.PedidoWhereInput = canalPedido ? { canalPedido } : {};

    if (usuario.perfil === PerfilUsuario.ADMIN) {
      return where;
    }

    if (usuario.perfil === PerfilUsuario.CLIENTE) {
      return { ...where, clienteId: usuario.id };
    }

    if (usuario.unidadeId) {
      return { ...where, unidadeId: usuario.unidadeId };
    }

    return { ...where, id: "__sem-acesso__" };
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
        throw new ConflictException("Estoque insuficiente para criar ou pagar o pedido.");
      }
    }
  }

  private validarItensUnicos(dto: CriarPedidoDto) {
    const produtosIds = new Set(dto.itens.map((item) => item.produtoId));

    if (produtosIds.size !== dto.itens.length) {
      throw new UnprocessableEntityException("Não repita produtos nos itens do pedido.");
    }
  }

  private gerarCodigoPedido() {
    return `PED-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}
