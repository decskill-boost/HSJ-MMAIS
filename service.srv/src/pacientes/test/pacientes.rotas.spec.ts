import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { UsersService } from '../../users/users.service';
import { PacientesController } from '../pacientes.controller';
import { PacientesService } from '../pacientes.service';

const CRIANCA = '11111111-1111-4111-8111-111111111111';
const QUEM_PEDE = '99999999-9999-4999-8999-999999999999';

/**
 * Pedidos reais contra a cadeia de guardas montada, não asserções sobre
 * metadados.
 *
 * É aqui que se vê o que os críticos mediram no servidor a sério: um handler
 * com `@Roles(...)` mas sem `RolesGuard` responde **200** a um token de
 * `paciente`, com o corpo inteiro da resposta. Como estas rotas servem
 * `notas_medicas`, nome, e-mail e leituras de frequência cardíaca de crianças,
 * o 403 tem de ser verificado com um pedido, não presumido.
 */
describe('Rotas de /pacientes — autorização e validação', () => {
  let app: INestApplication;
  let servidor: Server;
  const usersService = { findById: jest.fn() };

  const pacientesService = {
    getPacientesComAdesao: jest.fn().mockResolvedValue([]),
    getHistorico: jest.fn().mockResolvedValue({ dias: [], resumoSemanal: [] }),
    getSessoesConcluidas: jest.fn().mockResolvedValue([]),
    getPacientePorId: jest.fn().mockResolvedValue({
      idUser: CRIANCA,
      nome: 'Criança Teste',
      email: 'paciente@example.com',
      nivel: 1,
      xp: 0,
      streakAtual: 0,
    }),
  };

  const comPapel = (role: string) =>
    usersService.findById.mockResolvedValue({ idUser: QUEM_PEDE, role });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PacientesController],
      providers: [
        RolesGuard,
        { provide: PacientesService, useValue: pacientesService },
        { provide: UsersService, useValue: usersService },
      ],
    })
      // Só a verificação da assinatura JWKS é substituída: o token é dado por
      // válido, tal como aconteceria com uma conta real. O RolesGuard abaixo é
      // o verdadeiro, e vai à «base de dados» confirmar o papel.
      .overrideGuard(SupabaseAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          ctx.switchToHttp().getRequest().user = { sub: QUEM_PEDE };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    servidor = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    usersService.findById.mockReset();
    jest.clearAllMocks();
  });

  describe('com um token de paciente (a criança A a tentar ver a criança B)', () => {
    beforeEach(() => comPapel('paciente'));

    it.each([
      ['/pacientes'],
      [`/pacientes/${CRIANCA}`],
      [`/pacientes/${CRIANCA}/sessoes`],
      [`/pacientes/${CRIANCA}/historico`],
    ])('GET %s responde 403', async (caminho) => {
      await request(servidor).get(caminho).expect(403);
    });

    it('nenhum dado da criança chega a ser lido', async () => {
      await request(servidor).get(`/pacientes/${CRIANCA}`).expect(403);
      await request(servidor).get(`/pacientes/${CRIANCA}/sessoes`).expect(403);

      expect(pacientesService.getPacientePorId).not.toHaveBeenCalled();
      expect(pacientesService.getSessoesConcluidas).not.toHaveBeenCalled();
    });
  });

  describe('com um token de acompanhante ou de admin', () => {
    it.each([['acompanhante'], ['admin']])(
      'GET /pacientes/:id responde 403 para %s',
      async (role) => {
        comPapel(role);
        await request(servidor).get(`/pacientes/${CRIANCA}`).expect(403);
      },
    );
  });

  describe('com um token de corpo_clinico', () => {
    beforeEach(() => comPapel('corpo_clinico'));

    it('GET /pacientes/:id devolve o cabeçalho do perfil', async () => {
      const resposta = await request(servidor)
        .get(`/pacientes/${CRIANCA}`)
        .expect(200);

      expect(resposta.body).toMatchObject({ idUser: CRIANCA, nivel: 1 });
      expect(pacientesService.getPacientePorId).toHaveBeenCalledWith(CRIANCA);
    });

    it('GET /pacientes/:id/sessoes chega ao handler certo', async () => {
      await request(servidor)
        .get(`/pacientes/${CRIANCA}/sessoes`)
        .expect(200)
        .expect([]);

      expect(pacientesService.getSessoesConcluidas).toHaveBeenCalledWith(
        CRIANCA,
      );
    });

    it('a rota literal /historico não é capturada pelo :id', async () => {
      await request(servidor)
        .get(`/pacientes/${CRIANCA}/historico`)
        .expect(200);

      expect(pacientesService.getHistorico).toHaveBeenCalled();
      expect(pacientesService.getPacientePorId).not.toHaveBeenCalled();
    });

    it.each([['nao-e-um-uuid'], ['1'], ["'%20or%201=1--"]])(
      'um :id que não é UUID (%s) dá 400 e nunca chega à base de dados',
      async (id) => {
        await request(servidor).get(`/pacientes/${id}`).expect(400);
        expect(pacientesService.getPacientePorId).not.toHaveBeenCalled();
      },
    );

    it('uma tentativa de travessia de caminho não chega à base de dados', async () => {
      // O Express normaliza o caminho antes do encaminhamento: sai 404, não
      // 400 — o que interessa é que o serviço nunca é chamado.
      await request(servidor).get('/pacientes/../../etc/passwd').expect(404);
      expect(pacientesService.getPacientePorId).not.toHaveBeenCalled();
    });

    it('um :id que não é UUID em /sessoes dá 400', async () => {
      await request(servidor)
        .get('/pacientes/nao-e-um-uuid/sessoes')
        .expect(400);
      expect(pacientesService.getSessoesConcluidas).not.toHaveBeenCalled();
    });

    it('um :id que não é UUID em /historico dá 400 e não chega ao serviço', async () => {
      // A rota mais antiga do controlador não tinha o pipe: o id seguia até ao
      // Postgres e voltava como 500 com a mensagem do driver.
      await request(servidor)
        .get('/pacientes/nao-e-um-uuid/historico')
        .expect(400);
      expect(pacientesService.getHistorico).not.toHaveBeenCalled();
    });
  });
});
