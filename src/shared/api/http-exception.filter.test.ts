import { type ArgumentsHost, BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  it("formats http exceptions with path and timestamp", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const filter = new HttpExceptionFilter();

    filter.catch(new BadRequestException("Dados inválidos."), criarHost(status, "/auth/login"));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: "Bad Request",
      message: "Dados inválidos.",
      path: "/auth/login",
      timestamp: expect.any(String),
    });
  });

  it("hides unexpected exception messages from public responses", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const filter = new HttpExceptionFilter();

    filter.catch(new Error("database password leaked"), criarHost(status, "/usuarios"));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Erro interno no servidor.",
      path: "/usuarios",
      timestamp: expect.any(String),
    });
  });
});

function criarHost(status: ReturnType<typeof vi.fn>, url: string): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
}
