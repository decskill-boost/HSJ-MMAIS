import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Prescricao } from '../../entities/prescricao.entity';
import { SessaoRealizada, SessaoStatus } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { toLisbonDateKey } from '../../sessoes/streak.util';
import { PacientesService } from '../pacientes.service';

const mockPaciente = (overrides: Partial<Utilizador> = {}): Utilizador =>
  ({
    id_user: 'paciente-1',
    nome: 'Criança Teste',
    email: 'paciente@example.com',
    tipo_utilizador: 'paciente',
    xp: 0,
    nivel: 1,
    streak_atual: 0,
    streak_ultima_atividade: null,
    ...overrides,
  }) as Utilizador;

/** Day `offset` days from now, pinned to midday UTC to avoid Lisbon-TZ boundary flakiness. */
const diaRelativo = (offset: number): Date => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

describe('PacientesService', () => {
  let service: PacientesService;
  let utilizadorRepo: { findOne: jest.Mock; find: jest.Mock };
  let prescricaoRepo: { find: jest.Mock };
  let sessaoRepo: { find: jest.Mock };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PacientesService,
        {
          provide: getRepositoryToken(Utilizador),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        { provide: getRepositoryToken(Prescricao), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(SessaoRealizada), useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get(PacientesService);
    utilizadorRepo = module.get(getRepositoryToken(Utilizador));
    prescricaoRepo = module.get(getRepositoryToken(Prescricao));
    sessaoRepo = module.get(getRepositoryToken(SessaoRealizada));
  });

  it('throws when the patient does not exist', async () => {
    utilizadorRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getHistorico('paciente-1', '2026-06-01', '2026-06-05'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when the target user is not a paciente', async () => {
    utilizadorRepo.findOne.mockResolvedValue(
      mockPaciente({ tipo_utilizador: 'corpo_clinico' }),
    );

    await expect(
      service.getHistorico('paciente-1', '2026-06-01', '2026-06-05'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an inverted date range', async () => {
    utilizadorRepo.findOne.mockResolvedValue(mockPaciente());

    await expect(
      service.getHistorico('paciente-1', '2026-06-10', '2026-06-01'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a range longer than the maximum allowed', async () => {
    utilizadorRepo.findOne.mockResolvedValue(mockPaciente());

    await expect(
      service.getHistorico('paciente-1', '2026-01-01', '2026-12-31'),
    ).rejects.toThrow(BadRequestException);
  });

  it('builds the day-by-day history from prescriptions and sessions', async () => {
    utilizadorRepo.findOne.mockResolvedValue(mockPaciente());
    prescricaoRepo.find.mockResolvedValue([
      {
        data_inicio: diaRelativo(-10),
        data_validade: diaRelativo(10),
        frequencia_semanal: 3,
      },
    ]);
    sessaoRepo.find.mockResolvedValue([
      {
        id_sessao: 'sessao-1',
        id_exercicio: { nome_exercicio: 'Braços' },
        status: SessaoStatus.CONCLUIDO,
        esforco_1_a_10: 5,
        diversao_1_a_5: 4,
        duracao: 120,
        data_hora: diaRelativo(-3),
      },
    ]);

    const from = toLisbonDateKey(diaRelativo(-5));
    const to = toLisbonDateKey(diaRelativo(-1));

    const resultado = await service.getHistorico('paciente-1', from, to);

    expect(resultado.dias).toHaveLength(5);

    const diaComSessao = resultado.dias.find((d) => d.data === toLisbonDateKey(diaRelativo(-3)));
    expect(diaComSessao).toMatchObject({ status: 'concluido' });
    expect(diaComSessao?.sessoes[0]).toMatchObject({ nomeExercicio: 'Braços' });

    const diaSemSessao = resultado.dias.find((d) => d.data === toLisbonDateKey(diaRelativo(-5)));
    expect(diaSemSessao?.status).toBe('ignorado');
  });

  it('defaults to the current month when no range is provided', async () => {
    utilizadorRepo.findOne.mockResolvedValue(mockPaciente());
    prescricaoRepo.find.mockResolvedValue([]);
    sessaoRepo.find.mockResolvedValue([]);

    const resultado = await service.getHistorico('paciente-1');

    expect(resultado.dias.length).toBeGreaterThan(0);
    expect(prescricaoRepo.find).toHaveBeenCalled();
  });

  describe('getPacientesComAdesao', () => {
    it('returns an empty array and skips other queries when there are no patients', async () => {
      utilizadorRepo.find.mockResolvedValue([]);

      const resultado = await service.getPacientesComAdesao();

      expect(resultado).toEqual([]);
      expect(prescricaoRepo.find).not.toHaveBeenCalled();
      expect(sessaoRepo.find).not.toHaveBeenCalled();
    });

    it('returns null adesaoPercentual for every patient and skips the sessions query when nobody has a prescription', async () => {
      utilizadorRepo.find.mockResolvedValue([
        mockPaciente({ id_user: 'paciente-1', nome: 'Ana' }),
        mockPaciente({ id_user: 'paciente-2', nome: 'Bruno' }),
      ]);
      prescricaoRepo.find.mockResolvedValue([]);

      const resultado = await service.getPacientesComAdesao();

      expect(resultado).toEqual([
        { idUser: 'paciente-1', nome: 'Ana', email: 'paciente@example.com', adesaoPercentual: null },
        { idUser: 'paciente-2', nome: 'Bruno', email: 'paciente@example.com', adesaoPercentual: null },
      ]);
      expect(sessaoRepo.find).not.toHaveBeenCalled();
    });

    it('computes each patient adherence independently, without mixing sessions between patients', async () => {
      utilizadorRepo.find.mockResolvedValue([
        mockPaciente({ id_user: 'paciente-1', nome: 'Ana' }),
        mockPaciente({ id_user: 'paciente-2', nome: 'Bruno' }),
      ]);
      prescricaoRepo.find.mockResolvedValue([
        {
          id_paciente: { id_user: 'paciente-1' },
          data_inicio: diaRelativo(-4),
          data_validade: diaRelativo(10),
          frequencia_semanal: 3,
        },
        // paciente-2 has no prescription at all.
      ]);
      sessaoRepo.find.mockResolvedValue([
        {
          id_sessao: 'sessao-1',
          id_paciente: { id_user: 'paciente-1' },
          status: SessaoStatus.CONCLUIDO,
          esforco_1_a_10: 5,
          diversao_1_a_5: 4,
          duracao: 120,
          data_hora: diaRelativo(-2),
        },
      ]);

      const resultado = await service.getPacientesComAdesao();

      const ana = resultado.find((p) => p.idUser === 'paciente-1');
      const bruno = resultado.find((p) => p.idUser === 'paciente-2');
      // -4..-1 are resolved days (4), of which -2 is concluido -> 1/4 = 25%.
      expect(ana?.adesaoPercentual).toBe(25);
      expect(bruno?.adesaoPercentual).toBeNull();
    });

    it('queries prescriptions and sessions exactly once regardless of patient count', async () => {
      utilizadorRepo.find.mockResolvedValue([
        mockPaciente({ id_user: 'paciente-1' }),
        mockPaciente({ id_user: 'paciente-2' }),
        mockPaciente({ id_user: 'paciente-3' }),
      ]);
      prescricaoRepo.find.mockResolvedValue([
        {
          id_paciente: { id_user: 'paciente-1' },
          data_inicio: diaRelativo(-4),
          data_validade: diaRelativo(10),
          frequencia_semanal: 3,
        },
      ]);
      sessaoRepo.find.mockResolvedValue([]);

      await service.getPacientesComAdesao();

      expect(prescricaoRepo.find).toHaveBeenCalledTimes(1);
      expect(sessaoRepo.find).toHaveBeenCalledTimes(1);
    });

    it('falls back to today for a prescription with no data_validade (does not crash and extends the window through today)', async () => {
      utilizadorRepo.find.mockResolvedValue([mockPaciente({ id_user: 'paciente-1' })]);
      prescricaoRepo.find.mockResolvedValue([
        {
          id_paciente: { id_user: 'paciente-1' },
          data_inicio: diaRelativo(-5),
          data_validade: null,
          frequencia_semanal: 2,
        },
      ]);
      sessaoRepo.find.mockResolvedValue([
        {
          id_sessao: 'sessao-1',
          id_paciente: { id_user: 'paciente-1' },
          status: SessaoStatus.CONCLUIDO,
          esforco_1_a_10: 5,
          diversao_1_a_5: 4,
          duracao: 120,
          data_hora: diaRelativo(-2),
        },
      ]);

      const resultado = await service.getPacientesComAdesao();

      // -5..-1 are resolved days (5, today itself is pendente), of which -2 is concluido -> 1/5 = 20%.
      expect(resultado[0].adesaoPercentual).toBe(20);
    });
  });
});
