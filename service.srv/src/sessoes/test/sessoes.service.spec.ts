import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Exercicio } from '../../entities/exercicio.entity';
import { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { ConcluirExercicioDto } from '../dto/concluir-exercicio.dto';
import { SessoesService } from '../sessoes.service';

const mockExercicio = (overrides: Partial<Exercicio> = {}): Exercicio =>
  ({
    id_exercicio: 'exercicio-1',
    nome_exercicio: 'Braços',
    recompensa_xp: 10,
    categoria: 'Relaxamento',
    url_video: null,
    duracao_segundos: 600,
    dificuldade_clinica: 3,
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

const dto: ConcluirExercicioDto = {
  id_exercicio: 'exercicio-1',
  id_prescricao: 'prescricao-1',
};

describe('SessoesService', () => {
  let service: SessoesService;
  let sessaoRepo: { findOne: jest.Mock };
  let exercicioRepo: { findOne: jest.Mock };
  let utilizadorRepo: { findOne: jest.Mock };
  let manager: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    manager = {
      create: jest.fn((_entity, data) => ({ id_sessao: 'sessao-1', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
    };

    const module = await Test.createTestingModule({
      providers: [
        SessoesService,
        {
          provide: getRepositoryToken(SessaoRealizada),
          useValue: { findOne: jest.fn() },
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

  it('throws when the exercise does not exist or is inactive', async () => {
    exercicioRepo.findOne.mockResolvedValue(null);

    await expect(service.concluirExercicio('paciente-1', dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('awards xp and records the session on first completion today', async () => {
    exercicioRepo.findOne.mockResolvedValue(mockExercicio());
    sessaoRepo.findOne.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(mockUser({ xp: 90, nivel: 1 }));

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
    utilizadorRepo.findOne.mockResolvedValue(
      mockUser({ xp: 50, nivel: 1, streak_atual: 2, streak_ultima_atividade: new Date() }),
    );

    const result = await service.concluirExercicio('paciente-1', dto);

    expect(result).toMatchObject({
      xpGained: 0,
      totalXp: 50,
      level: 1,
      leveledUp: false,
      streakAtual: 2,
      alreadyCompletedToday: true,
      sessionId: 'sessao-existing',
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('does not level up when the reward does not cross a threshold', async () => {
    exercicioRepo.findOne.mockResolvedValue(mockExercicio({ recompensa_xp: 5 }));
    sessaoRepo.findOne.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(mockUser({ xp: 10, nivel: 1 }));

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
    manager.findOne.mockResolvedValue(
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
    manager.findOne.mockResolvedValue(
      mockUser({ xp: 10, nivel: 1, streak_atual: 3, streak_ultima_atividade: yesterday }),
    );

    const result = await service.concluirExercicio('paciente-1', dto);

    expect(result.streakAtual).toBe(4);
  });

  it('resets the streak to 1 after a multi-day gap', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    exercicioRepo.findOne.mockResolvedValue(mockExercicio());
    sessaoRepo.findOne.mockResolvedValue(null);
    manager.findOne.mockResolvedValue(
      mockUser({ xp: 10, nivel: 1, streak_atual: 10, streak_ultima_atividade: threeDaysAgo }),
    );

    const result = await service.concluirExercicio('paciente-1', dto);

    expect(result.streakAtual).toBe(1);
  });
});