import { Module } from "@nestjs/common";
import { EstoquesController } from "./api/estoques.controller";
import { EstoquesService } from "./application/estoques.service";

@Module({
  controllers: [EstoquesController],
  providers: [EstoquesService],
})
export class EstoquesModule {}
