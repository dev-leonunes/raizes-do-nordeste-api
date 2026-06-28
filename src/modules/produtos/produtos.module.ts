import { Module } from "@nestjs/common";
import { ProdutosController } from "./api/produtos.controller";
import { ProdutosService } from "./application/produtos.service";

@Module({
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
