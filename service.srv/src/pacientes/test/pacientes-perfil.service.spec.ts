import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Prescricao } from '../../entities/prescricao.entity';
import { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import {
  SessaoRealizada,
  SessaoStatus,
} from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { PacientesService } from '../pacientes.service';

const PACIENTE_A = '11111111-1111-4111-8111-111111111111';
const PACIENTE_B = '22222222-2222-4222-8222-222222222222';

const mockUtilizador = (overrides: Partial<Utilizador> = {}): Utilizador =>
  ({
    id_user: PACIENTE_A,
    nome: 'Criança Teste',
    email: 'paciente@example.com',
    tipo_utilizador: 'paciente',
    xp: 250,
    nivel: 3,
    streak_atual: 4,
    streak_ultima_atividade: null,
    ...overrides,
  }) as Utilizador;

const mockQueryBuilder = (linhas: unknown[] = []) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(linhas),
});

/** Hora de parede, sem fuso: é assim que `data_hora` sai para o painel clínico. */
const FORMATO_SEM_FUSO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;

/** Hoje ao meio-dia, hora de parede local — o formato em que a coluna é lida. */
const horasAtras = (horas: number): Date => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setHours(d.getHours() - horas);
  return d;
};

describe('PacientesService — perfil, sessões e agregados', () => {
  let service: PacientesService;
  let utilizadorRepo: { findOne: jest.Mock; find: jest.Mock };
  let prescricaoRepo: { find: jest.Mock };
  let sessaoRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PacientesService,
        {
          provide: getRepositoryToken(Utilizador),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Prescricao),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(SessaoRealizada),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder()),
          },
        },
        // Ver a nota em pacientes.service.spec.ts: dependência nova do serviço.
        {
          provide: getRepositoryToken(PrescricaoExercicio),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get(PacientesService);
    utilizadorRepo = module.get(getRepositoryToken(Utilizador));
    prescricaoRepo = module.get(getRepositoryToken(Prescricao));
    sessaoRepo = module.get(getRepositoryToken(SessaoRealizada));
  });

  describe('getPacientePorId (E7)', () => {
    it('devolve o cabeçalho do perfil de uma criança', async () => {
      utilizadorRepo.findOne.mockResolvedValue(
        mockUtilizador({
          streak_atual: 4,
          streak_ultima_atividade: new Date(),
        }),
      );

      const resultado = await service.getPacientePorId(PACIENTE_A);

      expect(resultado).toEqual({
        idUser: PACIENTE_A,
        nome: 'Criança Teste',
        email: 'paciente@example.com',
        nivel: 3,
        xp: 250,
        streakAtual: 4,
      });
    });

    it('não devolve a role, a foto nem as permissões do registo', async () => {
      utilizadorRepo.findOne.mockResolvedValue(mockUtilizador());

      const resultado = await service.getPacientePorId(PACIENTE_A);

      expect(Object.keys(resultado).sort()).toEqual([
        'email',
        'idUser',
        'nivel',
        'nome',
        'streakAtual',
        'xp',
      ]);
    });

    it('usa getEffectiveStreak: uma sequência interrompida sai a zero', async () => {
      const haTresDias = new Date();
      haTresDias.setDate(haTresDias.getDate() - 3);
      utilizadorRepo.findOne.mockResolvedValue(
        mockUtilizador({
          streak_atual: 9,
          streak_ultima_atividade: haTresDias,
        }),
      );

      const resultado = await service.getPacientePorId(PACIENTE_A);

      expect(resultado.streakAtual).toBe(0);
    });

    it('404 quando o utilizador não existe', async () => {
      utilizadorRepo.findOne.mockResolvedValue(null);

      await expect(service.getPacientePorId(PACIENTE_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it.each([['corpo_clinico'], ['admin'], ['acompanhante']])(
      'AUTORIZAÇÃO: 404 para um utilizador com tipo_utilizador=%s (não é um leitor genérico de `utilizadores`)',
      async (tipo) => {
        utilizadorRepo.findOne.mockResolvedValue(
          mockUtilizador({ tipo_utilizador: tipo }),
        );

        await expect(service.getPacientePorId(PACIENTE_A)).rejects.toThrow(
          NotFoundException,
        );
      },
    );
  });

  describe('getSessoesConcluidas (E8)', () => {
    it('AUTORIZAÇÃO: confirma que o :id é um paciente ANTES de o usar como filtro', async () => {
      utilizadorRepo.findOne.mockResolvedValue(
        mockUtilizador({ tipo_utilizador: 'corpo_clinico' }),
      );

      await expect(service.getSessoesConcluidas(PACIENTE_A)).rejects.toThrow(
        NotFoundException,
      );
      expect(sessaoRepo.find).not.toHaveBeenCalled();
    });

    it('AUTORIZAÇÃO: filtra sempre pelo paciente pedido e só por sessões concluídas', async () => {
      utilizadorRepo.findOne.mockResolvedValue(
        mockUtilizador({ id_user: PACIENTE_B }),
      );
      sessaoRepo.find.mockResolvedValue([]);

      await service.getSessoesConcluidas(PACIENTE_B);

      expect(sessaoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id_paciente: { id_user: PACIENTE_B },
            status: SessaoStatus.CONCLUIDO,
          },
          order: { data_hora: 'DESC' },
        }),
      );
    });

    it('achata o nome do exercício e preserva as leituras clínicas', async () => {
      utilizadorRepo.findOne.mockResolvedValue(mockUtilizador());
      const quando = horasAtras(2);
      sessaoRepo.find.mockResolvedValue([
        {
          id_sessao: 'sessao-1',
          data_hora: quando,
          duracao: 300,
          esforco_1_a_10: 6,
          diversao_1_a_5: 5,
          fc_media: 110,
          fc_maxima: 140,
          teve_problemas: true,
          id_exercicio: { nome_exercicio: 'Saltos' },
        },
      ]);

      const [sessao] = await service.getSessoesConcluidas(PACIENTE_A);

      expect(sessao).toEqual({
        id_sessao: 'sessao-1',
        data_hora: expect.stringMatching(FORMATO_SEM_FUSO) as string,
        duracao: 300,
        esforco_1_a_10: 6,
        diversao_1_a_5: 5,
        fc_media: 110,
        fc_maxima: 140,
        teve_problemas: true,
        nome_exercicio: 'Saltos',
        // Campos acrescentados no PR #76: o histórico clínico passou a
        // identificar o plano de onde veio o treino. Um treino solto (sem
        // plano) mantém-nos a null, que é este caso.
        id_prescricao: null,
        nome_plano: null,
        total_exercicios_plano: null,
        exercicios_plano: [],
      });
      // Hora de parede, sem «Z»: é assim que o painel clínico a lê hoje.
      expect(sessao.data_hora).not.toMatch(/Z$/);
      expect(new Date(sessao.data_hora).getTime()).toBe(quando.getTime());
    });

    it('um treino cujo exercício já saiu do catálogo não desaparece da lista', async () => {
      utilizadorRepo.findOne.mockResolvedValue(mockUtilizador());
      sessaoRepo.find.mockResolvedValue([
        {
          id_sessao: 'sessao-1',
          data_hora: horasAtras(1),
          duracao: null,
          esforco_1_a_10: null,
          diversao_1_a_5: null,
          fc_media: null,
          fc_maxima: null,
          teve_problemas: null,
          id_exercicio: null,
        },
      ]);

      const [sessao] = await service.getSessoesConcluidas(PACIENTE_A);

      expect(sessao.nome_exercicio).toBe('Exercício');
      expect(sessao.teve_problemas).toBe(false);
    });
  });

  describe('getPacientesComAdesao — agregados de sessões (E9)', () => {
    const pacientes = [
      mockUtilizador({ id_user: PACIENTE_A, nome: 'Ana' }),
      mockUtilizador({ id_user: PACIENTE_B, nome: 'Bruno' }),
    ];

    it('junta último treino e total a cada criança, sem misturar entre crianças', async () => {
      utilizadorRepo.find.mockResolvedValue(pacientes);
      prescricaoRepo.find.mockResolvedValue([]);
      const ultimoDaAna = horasAtras(5);
      sessaoRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([
          { idPaciente: PACIENTE_A, ultimoTreino: ultimoDaAna, total: '12' },
        ]),
      );

      const resultado = await service.getPacientesComAdesao();

      const ana = resultado.find((p) => p.idUser === PACIENTE_A);
      const bruno = resultado.find((p) => p.idUser === PACIENTE_B);

      expect(ana?.totalSessoesConcluidas).toBe(12);
      expect(new Date(ana?.ultimoTreino ?? '').getTime()).toBe(
        ultimoDaAna.getTime(),
      );
      // Bruno não tem sessões: nunca herda as da Ana.
      expect(bruno?.ultimoTreino).toBeNull();
      expect(bruno?.totalSessoesConcluidas).toBe(0);
    });

    it('restringe o agregado aos ids da coorte e só a sessões concluídas', async () => {
      utilizadorRepo.find.mockResolvedValue(pacientes);
      prescricaoRepo.find.mockResolvedValue([]);
      const qb = mockQueryBuilder([]);
      sessaoRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getPacientesComAdesao();

      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('id_paciente IN'),
        {
          idsPacientes: [PACIENTE_A, PACIENTE_B],
        },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
        status: SessaoStatus.CONCLUIDO,
      });
    });

    it('faz uma única consulta agregada, independentemente do número de crianças', async () => {
      utilizadorRepo.find.mockResolvedValue([
        ...pacientes,
        mockUtilizador({ id_user: '33333333-3333-4333-8333-333333333333' }),
      ]);
      prescricaoRepo.find.mockResolvedValue([]);

      await service.getPacientesComAdesao();

      expect(sessaoRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('COUNT(*) de Postgres chega como texto e sai como número', async () => {
      utilizadorRepo.find.mockResolvedValue([pacientes[0]]);
      prescricaoRepo.find.mockResolvedValue([]);
      sessaoRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([
          { idPaciente: PACIENTE_A, ultimoTreino: null, total: '7' },
        ]),
      );

      const [ana] = await service.getPacientesComAdesao();

      expect(ana.totalSessoesConcluidas).toBe(7);
      expect(ana.ultimoTreino).toBeNull();
    });
  });
});
