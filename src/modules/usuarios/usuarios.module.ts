import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UsuariosController } from "./api/usuarios.controller";
import { UsuariosService } from "./application/usuarios.service";

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
