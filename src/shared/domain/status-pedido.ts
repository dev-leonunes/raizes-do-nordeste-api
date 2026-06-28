import { StatusPedido } from "@prisma/client";

const transicoesPermitidas: Record<StatusPedido, StatusPedido[]> = {
  AGUARDANDO_PAGAMENTO: [
    StatusPedido.PAGO,
    StatusPedido.PAGAMENTO_RECUSADO,
    StatusPedido.CANCELADO,
  ],
  PAGO: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
  EM_PREPARO: [StatusPedido.PRONTO, StatusPedido.CANCELADO],
  PRONTO: [StatusPedido.ENTREGUE],
  ENTREGUE: [],
  CANCELADO: [],
  PAGAMENTO_RECUSADO: [],
};

export function podeTransicionarStatusPedido(
  statusAtual: StatusPedido,
  proximoStatus: StatusPedido,
) {
  return transicoesPermitidas[statusAtual].includes(proximoStatus);
}
