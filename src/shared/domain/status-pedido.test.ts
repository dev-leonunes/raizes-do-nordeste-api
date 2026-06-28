import { StatusPedido } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { podeTransicionarStatusPedido } from "./status-pedido";

describe("podeTransicionarStatusPedido", () => {
  it("allows the main flow to continue after payment", () => {
    expect(podeTransicionarStatusPedido(StatusPedido.PAGO, StatusPedido.EM_PREPARO)).toBe(true);
    expect(podeTransicionarStatusPedido(StatusPedido.EM_PREPARO, StatusPedido.PRONTO)).toBe(true);
    expect(podeTransicionarStatusPedido(StatusPedido.PRONTO, StatusPedido.ENTREGUE)).toBe(true);
  });

  it("prevents transitions from delivered orders", () => {
    expect(podeTransicionarStatusPedido(StatusPedido.ENTREGUE, StatusPedido.CANCELADO)).toBe(false);
  });
});
