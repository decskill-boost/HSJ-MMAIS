import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // PERMITIR A LIGAÇÃO DO FRONTEND
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
