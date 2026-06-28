import { HttpStatus, Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./shared/api/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Raízes do Nordeste API")
    .setDescription("API Back-end do projeto multidisciplinar Raízes do Nordeste.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get<number>("PORT", 3000);
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  for (let i = 0; i < 2; i++) {
    console.log("");
  }
  logger.log(`API disponível em ${baseUrl}`);
  logger.log(`Health check disponível em ${baseUrl}/health`);
  logger.log(`Swagger disponível em ${baseUrl}/docs`);
}

bootstrap();
