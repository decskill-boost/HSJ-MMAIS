import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SupabaseAuthGuard } from '../src/auth/supabase-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { ExerciciosController } from '../src/exercicios/exercicios.controller';
import { ExerciciosService } from '../src/exercicios/exercicios.service';
import { PrescricoesController } from '../src/prescricoes/prescricoes.controller';
import { PrescricoesService } from '../src/prescricoes/prescricoes.service';
import { UsersService } from '../src/users/users.service';

/**
 * Estes endpoints estiveram completamente abertos: qualquer pedido anónimo
 * criava, editava e cancelava planos de crianças em tratamento, e podia apagar
 * a biblioteca de exercícios.
 *
 * O teste monta os controladores reais com as guardas reais (só os serviços de
 * dados é que são falsos, para não precisar de base de dados) e confirma que um
 * pedido sem credenciais é recusado. Se alguém remover um `@UseGuards`, isto
 * fica vermelho.
 */
describe('Guardas de autenticação (e2e)', () => {
  let app: INestApplication<App>;
  const naoDeviaSerChamado = () => {
    throw new Error('o serviço foi chamado sem autenticação');
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [PrescricoesController, ExerciciosController],
      providers: [
        SupabaseAuthGuard,
        RolesGuard,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'https://exemplo.supabase.co' },
        },
        {
          provide: PrescricoesService,
          useValue: {
            create: naoDeviaSerChamado,
            update: naoDeviaSerChamado,
            cancel: naoDeviaSerChamado,
          },
        },
        {
          provide: ExerciciosService,
          useValue: {
            findAll: naoDeviaSerChamado,
            findOne: naoDeviaSerChamado,
            create: naoDeviaSerChamado,
            update: naoDeviaSerChamado,
            remove: naoDeviaSerChamado,
          },
        },
        { provide: UsersService, useValue: { findOne: naoDeviaSerChamado } },
      ],
    }).compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const ID = '11111111-2222-4333-8444-555555555555';

  describe('sem cabeçalho Authorization', () => {
    const casos: [string, string][] = [
      ['post', '/prescricoes'],
      ['put', `/prescricoes/${ID}`],
      ['patch', `/prescricoes/${ID}/cancel`],
      ['get', '/exercicios'],
      ['get', `/exercicios/${ID}`],
      ['post', '/exercicios'],
      ['put', `/exercicios/${ID}`],
      ['delete', `/exercicios/${ID}`],
    ];

    it.each(casos)('%s %s responde 401', async (metodo, caminho) => {
      const servidor = app.getHttpServer();
      await request(servidor)[metodo as 'get'](caminho).expect(401);
    });
  });

  it('um token que não é um JWT também é recusado', async () => {
    await request(app.getHttpServer())
      .get('/exercicios')
      .set('Authorization', 'Bearer isto-nao-e-um-token')
      .expect(401);
  });
});
