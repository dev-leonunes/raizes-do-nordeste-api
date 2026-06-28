import { Module } from "@nestjs/common";
import { UsuariosController } from "./api/usuarios.controller";
import { UsuariosService } from "./application/usuarios.service";

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
