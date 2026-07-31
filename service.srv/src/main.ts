import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  /**
   * Validação de tudo o que entra. Sem isto, valores clínicos chegavam crus à
   * base de dados — um esforço de 500 ou uma frequência cardíaca negativa
   * ficavam gravados e apareciam ao corpo clínico como leitura verdadeira.
   *
   * `whitelist` descarta campos que nenhum DTO declara, para não se escrever
   * na base de dados o que o cliente entender mandar.
   */
  /*
   * Não há `exceptionFactory` à medida de propósito. Houve um, e escrevia
   * `JSON.stringify(errors)` para os registos — mas um erro de validação leva
   * consigo o VALOR submetido, por isso um `POST /users` recusado deixava a
   * palavra-passe em claro nos registos da Vercel. A resposta por omissão do
   * Nest já traz as mensagens das restrições, que é o que o cliente precisa.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // PERMITIR A LIGAÇÃO DO FRONTEND
  const allowedOrigins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
