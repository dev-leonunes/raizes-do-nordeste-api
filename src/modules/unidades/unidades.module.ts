import { Module } from "@nestjs/common";
import { UnidadesController } from "./api/unidades.controller";
import { UnidadesService } from "./application/unidades.service";

@Module({
  controllers: [UnidadesController],
  providers: [UnidadesService],
})
export class UnidadesModule {}
