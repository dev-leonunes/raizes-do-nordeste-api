import { Module } from "@nestjs/common";
import { AuditoriasController } from "./api/auditorias.controller";
import { AuditoriasService } from "./application/auditorias.service";

@Module({
  controllers: [AuditoriasController],
  providers: [AuditoriasService],
})
export class AuditoriasModule {}
