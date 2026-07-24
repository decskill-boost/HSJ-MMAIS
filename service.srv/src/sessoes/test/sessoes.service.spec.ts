import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Exercicio } from '../../entities/exercicio.entity';
import { SessaoRealizada, SessaoStatus } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { ConcluirExercicioDto } from '../dto/concluir-exercicio.dto';
import { IniciarExercicioDto } from '../dto/iniciar-exercicio.dto';
import { SessoesService } from '../sessoes.service';

const mockExercicio = (overrides: Partial<Exercicio> = {}): Exercicio =>
  ({
    id_exercicio: 'exercicio-1',
    nome_exercicio: 'Braços',
    recompensa_xp: 10,
    categoria: 'Relaxamento',
    url_video: null,
    duracao_segundos: 600,
    dificuldade_clinica: 'facil',
    descricao: null,
    ativo: true,
    ...overrides,
  }) as Exercicio;

const mockUser = (overrides: Partial<Utilizador> = {}): Utilizador =>
  ({
    id_user: 'paciente-1',
    nome: 'Criança Teste',
    email: 'paciente@example.com',
    tipo_utilizador: 'paciente',
    xp: 0,
    nivel: 1,
    streak_atual: 0,
    streak_ultima_atividade: null,
    data_registo: new Date(),
    url_foto_perfil: null,
    permissoesDirectas: [],
    ...overrides,
  }) as Utilizador;

const mockSessao = (overrides: Partial<SessaoRealizada> = {}): SessaoRealizada =>
  ({
    id_sessao: 'sessao-iniciada',
    status: SessaoStatus.INICIADO,
    concluido: false,
    data_hora: new Date(),
    ...overrides,
  }) as SessaoRealizada;

const dto: ConcluirExercicioDto = {
  id_exercicio: 'exercicio-1',
  id_prescricao: 'prescricao-1',
};

const iniciarDto: IniciarExercicioDto = {
  id_exercicio: 'exercicio-1',
  id_prescricao: 'prescricao-1',
};

describe('SessoesService', () => {
  let service: SessoesService;
  let sessaoRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let exercicioRepo: { findOne: jest.Mock };
  let utilizadorRepo: { findOne: jest.Mock };
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  /** Configures manager.findOne to answer differently depending on which entity is queried. */
  const mockManagerFindOne = (
    sessaoIniciada: SessaoRealizada | null,
    user: Utilizador | null,
  ) => {
    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === SessaoRealizada) return Promise.resolve(sessaoIniciada);
      return Promise.resolve(user);
    });
  };

  beforeEach(async () => {
    manager = {
      create: jest.fn((_entity, data) => ({ id_sessao: 'sessao-1', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
    };

    const module = await Test.createTestingModule({
      providers: [
        SessoesService,
        {
          provide: getRepositoryToken(SessaoRealizada),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Exercicio),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Utilizador),
          useValue: { findOne: jest.fn() },
        },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get(SessoesService);
    sessaoRepo = module.get(getRepositoryToken(SessaoRealizada));
    exercicioRepo = module.get(getRepositoryToken(Exercicio));
    utilizadorRepo = module.get(getRepositoryToken(Utilizador));
  });

  describe('iniciarExercicio', () => {
    it('throws when the exercise does not exist or is inactive', async () => {
      exercicioRepo.findOne.mockResolvedValue(null);

      await expect(service.iniciarExercicio('paciente-1', iniciarDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a new iniciado row when none exists yet today', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne
        .mockResolvedValueOnce(null) // no concluido today
        .mockResolvedValueOnce(null); // no iniciado today
      sessaoRepo.create.mockImplementation((data) => ({ id_sessao: 'sessao-nova', ...data }));
      sessaoRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.iniciarExercicio('paciente-1', iniciarDto);

      expect(result).toEqual({ sessionId: 'sessao-nova', alreadyCompletedToday: false });
      expect(sessaoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: SessaoStatus.INICIADO, concluido: false }),
      );
    });

    it('reuses today\'s iniciado row instead of creating a duplicate', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne
        .mockResolvedValueOnce(null) // no concluido today
        .mockResolvedValueOnce(mockSessao({ id_sessao: 'sessao-existente' }));

      const result = await service.iniciarExercicio('paciente-1', iniciarDto);

      expect(result).toEqual({ sessionId: 'sessao-existente', alreadyCompletedToday: false });
      expect(sessaoRepo.create).not.toHaveBeenCalled();
    });

    it('does not create a row when the exercise was already completed today', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValueOnce(
        mockSessao({ id_sessao: 'sessao-concluida', status: SessaoStatus.CONCLUIDO }),
      );

      const result = await service.iniciarExercicio('paciente-1', iniciarDto);

      expect(result).toEqual({ sessionId: 'sessao-concluida', alreadyCompletedToday: true });
      expect(sessaoRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('concluirExercicio', () => {
    it('throws when the exercise does not exist or is inactive', async () => {
      exercicioRepo.findOne.mockResolvedValue(null);

      await expect(service.concluirExercicio('paciente-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('transitions an existing iniciado row to concluido instead of inserting a new one', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      const sessaoIniciada = mockSessao();
      mockManagerFindOne(sessaoIniciada, mockUser({ xp: 90, nivel: 1 }));

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(manager.create).not.toHaveBeenCalled();
      expect(sessaoIniciada.status).toBe(SessaoStatus.CONCLUIDO);
      expect(sessaoIniciada.concluido).toBe(true);
      expect(result).toMatchObject({ sessionId: 'sessao-iniciada', alreadyCompletedToday: false });
    });

    it('always scopes the iniciado lookup to today, even when id_sessao is supplied, so a session left open from a previous day cannot be completed under today\'s XP with a stale date', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(null, mockUser({ xp: 90, nivel: 1 }));

      await service.concluirExercicio('paciente-1', { ...dto, id_sessao: 'sessao-de-ontem' });

      const chamadaSessao = manager.findOne.mock.calls.find(
        ([entity]) => entity === SessaoRealizada,
      );
      expect(chamadaSessao).toBeDefined();
      const [, options] = chamadaSessao!;
      expect(options.where).toMatchObject({ id_sessao: 'sessao-de-ontem' });
      expect(options.where.data_hora).toBeDefined();
    });

    it('falls back to inserting a new row when there is no iniciado row (legacy client)', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(null, mockUser({ xp: 90, nivel: 1 }));

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(manager.create).toHaveBeenCalledWith(
        SessaoRealizada,
        expect.objectContaining({ status: SessaoStatus.CONCLUIDO, concluido: true }),
      );
      expect(result).toMatchObject({ xpGained: 10, totalXp: 100, alreadyCompletedToday: false });
    });

    it('flips stale iniciado rows from earlier days to falhado', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(mockSessao(), mockUser({ xp: 90, nivel: 1 }));

      await service.concluirExercicio('paciente-1', dto);

      expect(manager.update).toHaveBeenCalledWith(
        SessaoRealizada,
        expect.objectContaining({ status: SessaoStatus.INICIADO }),
        { status: SessaoStatus.FALHADO },
      );
    });

    it('awards xp and records the session on first completion today', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(null, mockUser({ xp: 90, nivel: 1 }));

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(result).toMatchObject({
        xpGained: 10,
        totalXp: 100,
        level: 2,
        leveledUp: true,
        streakAtual: 1,
        alreadyCompletedToday: false,
      });
      expect(manager.save).toHaveBeenCalledTimes(2);
    });

    it('does not award xp twice for the same exercise on the same day', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue({
        id_sessao: 'sessao-existing',
      } as SessaoRealizada);
      const user = mockUser({ xp: 50, nivel: 1, streak_atual: 2, streak_ultima_atividade: new Date() });
      mockManagerFindOne(null, user);

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(result).toMatchObject({
        xpGained: 0,
        totalXp: 50,
        level: 1,
        leveledUp: false,
        streakAtual: 2,
        alreadyCompletedToday: true,
      });
      expect(manager.save).toHaveBeenCalled();
    });

    it('does not level up when the reward does not cross a threshold', async () => {
      exercicioRepo.findOne.mockResolvedValue(mockExercicio({ recompensa_xp: 5 }));
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(null, mockUser({ xp: 10, nivel: 1 }));

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(result.leveledUp).toBe(false);
      expect(result.level).toBe(1);
      expect(result.totalXp).toBe(15);
    });

    it('awards xp for a second, different exercise on the same day without incrementing the streak again', async () => {
      // Simulates the second of two different exercises completed the same day: the per-exercise
      // dedupe check (sessaoRepo) finds nothing for THIS exercise, so it still reaches the
      // transaction branch and earns xp, but the streak was already updated earlier today.
      exercicioRepo.findOne.mockResolvedValue(mockExercicio({ id_exercicio: 'exercicio-2' }));
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(
        null,
        mockUser({ xp: 10, nivel: 1, streak_atual: 1, streak_ultima_atividade: new Date() }),
      );

      const result = await service.concluirExercicio('paciente-1', {
        ...dto,
        id_exercicio: 'exercicio-2',
      });

      expect(result.xpGained).toBe(10);
      expect(result.streakAtual).toBe(1);
    });

    it('increments the streak when completing an exercise on the next consecutive day', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(
        null,
        mockUser({ xp: 10, nivel: 1, streak_atual: 3, streak_ultima_atividade: yesterday }),
      );

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(result.streakAtual).toBe(4);
    });

    it('resets the streak to 1 after a multi-day gap', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      exercicioRepo.findOne.mockResolvedValue(mockExercicio());
      sessaoRepo.findOne.mockResolvedValue(null);
      mockManagerFindOne(
        null,
        mockUser({ xp: 10, nivel: 1, streak_atual: 10, streak_ultima_atividade: threeDaysAgo }),
      );

      const result = await service.concluirExercicio('paciente-1', dto);

      expect(result.streakAtual).toBe(1);
    });
  });
});
