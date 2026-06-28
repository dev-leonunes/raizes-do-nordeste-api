import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuditoriasModule } from "./modules/auditorias/auditorias.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EstoquesModule } from "./modules/estoques/estoques.module";
import { PagamentosModule } from "./modules/pagamentos/pagamentos.module";
import { PedidosModule } from "./modules/pedidos/pedidos.module";
import { ProdutosModule } from "./modules/produtos/produtos.module";
import { UnidadesModule } from "./modules/unidades/unidades.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { HealthController } from "./shared/api/health.controller";
import { PrismaModule } from "./shared/infrastructure/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    UnidadesModule,
    ProdutosModule,
    EstoquesModule,
    PedidosModule,
    PagamentosModule,
    AuditoriasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
