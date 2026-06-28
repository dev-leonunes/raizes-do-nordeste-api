import { StatusPedido } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { podeTransicionarStatusPedido } from "./status-pedido";

describe("podeTransicionarStatusPedido", () => {
  it("permite seguir o fluxo principal depois do pagamento", () => {
    expect(podeTransicionarStatusPedido(StatusPedido.PAGO, StatusPedido.EM_PREPARO)).toBe(true);
    expect(podeTransicionarStatusPedido(StatusPedido.EM_PREPARO, StatusPedido.PRONTO)).toBe(true);
    expect(podeTransicionarStatusPedido(StatusPedido.PRONTO, StatusPedido.ENTREGUE)).toBe(true);
  });

  it("nao permite sair de pedido entregue", () => {
    expect(podeTransicionarStatusPedido(StatusPedido.ENTREGUE, StatusPedido.CANCELADO)).toBe(false);
  });
});
