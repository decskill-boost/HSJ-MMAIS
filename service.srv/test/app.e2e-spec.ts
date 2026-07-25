import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prefixo: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mesmo prefixo global do main.ts — os caminhos testados têm de ser os
    // que a aplicação serve mesmo.
    prefixo = app.get(ConfigService).get<string>('API_PREFIX', 'api');
    app.setGlobalPrefix(prefixo);

    await app.init();
  });

  it(`GET /health responde ok`, async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/${prefixo}/health`)
      .expect(200);

    const corpo = resposta.body as { status: string; env: string };
    expect(corpo.status).toBe('ok');
    expect(corpo.env).toBeTruthy();
  });

  it('a raiz fora do prefixo não existe', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
