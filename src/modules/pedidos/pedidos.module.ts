import { Module } from "@nestjs/common";
import { PagamentosModule } from "../pagamentos/pagamentos.module";
import { PedidosController } from "./api/pedidos.controller";
import { PedidosService } from "./application/pedidos.service";

@Module({
  imports: [PagamentosModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
