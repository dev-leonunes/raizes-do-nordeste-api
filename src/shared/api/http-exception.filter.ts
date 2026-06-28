import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

type HttpResponseBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

type RequestLike = {
  url?: string;
};

type ResponseLike = {
  status: (statusCode: number) => {
    json: (body: Record<string, unknown>) => void;
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const request = contexto.getRequest<RequestLike>();
    const response = contexto.getResponse<ResponseLike>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.criarBody(exception, statusCode, request.url ?? "");

    response.status(statusCode).json(body);
  }

  private criarBody(exception: unknown, statusCode: number, path: string) {
    const response = exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseBody =
      typeof response === "object" && response !== null
        ? (response as HttpResponseBody)
        : undefined;
    const message =
      responseBody?.message ??
      (typeof response === "string" ? response : "Erro interno no servidor.");
    const error =
      responseBody?.error ??
      (exception instanceof HttpException ? exception.name : "Internal Server Error");

    return {
      statusCode,
      error,
      message,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
