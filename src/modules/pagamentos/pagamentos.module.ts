import { Module } from "@nestjs/common";
import { PagamentosService } from "./application/pagamentos.service";

@Module({
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
