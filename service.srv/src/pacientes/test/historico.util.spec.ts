import { SessaoStatus } from '../../entities/sessao-realizada.entity';
import {
  calcularAdesao,
  DiaStatus,
  deriveHistorico,
  PrescricaoWindow,
  SessaoParaHistorico,
} from '../historico.util';

const sessao = (overrides: Partial<SessaoParaHistorico> = {}): SessaoParaHistorico => ({
  idSessao: 'sessao-1',
  nomeExercicio: 'Braços',
  status: SessaoStatus.CONCLUIDO,
  esforco: 5,
  diversao: 4,
  duracaoSegundos: 120,
  dataHora: new Date('2026-06-10T10:00:00Z'),
  ...overrides,
});

const janela = (overrides: Partial<PrescricaoWindow> = {}): PrescricaoWindow => ({
  inicio: '2026-06-01',
  fim: '2026-06-30',
  frequenciaSemanal: 3,
  ...overrides,
});

describe('deriveHistorico', () => {
  it('marks a day with a completed session as concluido', () => {
    const { dias } = deriveHistorico(
      [sessao({ dataHora: new Date('2026-06-10T10:00:00Z') })],
      [janela()],
      '2026-06-10',
      '2026-06-10',
      '2026-06-15',
    );

    expect(dias).toHaveLength(1);
    expect(dias[0]).toMatchObject({ data: '2026-06-10', status: DiaStatus.CONCLUIDO });
    expect(dias[0].sessoes).toHaveLength(1);
  });

  it('marks a past day with only an iniciado session as falhado', () => {
    const { dias } = deriveHistorico(
      [sessao({ status: SessaoStatus.INICIADO, dataHora: new Date('2026-06-10T10:00:00Z') })],
      [janela()],
      '2026-06-10',
      '2026-06-10',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.FALHADO);
  });

  it('marks an explicitly falhado session as falhado', () => {
    const { dias } = deriveHistorico(
      [sessao({ status: SessaoStatus.FALHADO, dataHora: new Date('2026-06-10T10:00:00Z') })],
      [janela()],
      '2026-06-10',
      '2026-06-10',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.FALHADO);
  });

  it('marks today with only an iniciado session as pendente, not falhado', () => {
    const { dias } = deriveHistorico(
      [sessao({ status: SessaoStatus.INICIADO, dataHora: new Date('2026-06-15T10:00:00Z') })],
      [janela()],
      '2026-06-15',
      '2026-06-15',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.PENDENTE);
  });

  it('marks a future day as pendente', () => {
    const { dias } = deriveHistorico(
      [],
      [janela()],
      '2026-06-20',
      '2026-06-20',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.PENDENTE);
  });

  it('marks an empty past day inside a prescription window as ignorado', () => {
    const { dias } = deriveHistorico([], [janela()], '2026-06-05', '2026-06-05', '2026-06-15');

    expect(dias[0].status).toBe(DiaStatus.IGNORADO);
  });

  it('marks an empty past day outside any prescription window as sem_plano', () => {
    const { dias } = deriveHistorico(
      [],
      [janela({ inicio: '2026-06-12', fim: '2026-06-30' })],
      '2026-06-05',
      '2026-06-05',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.SEM_PLANO);
  });

  it('prioritizes concluido over falhado when a day has both', () => {
    const { dias } = deriveHistorico(
      [
        sessao({ idSessao: 'a', status: SessaoStatus.FALHADO }),
        sessao({ idSessao: 'b', status: SessaoStatus.CONCLUIDO }),
      ],
      [janela()],
      '2026-06-10',
      '2026-06-10',
      '2026-06-15',
    );

    expect(dias[0].status).toBe(DiaStatus.CONCLUIDO);
    expect(dias[0].sessoes).toHaveLength(2);
  });

  it('builds a weekly summary counting completed days against the expected frequency', () => {
    const { resumoSemanal } = deriveHistorico(
      [
        sessao({ dataHora: new Date('2026-06-08T10:00:00Z') }), // Monday
        sessao({ idSessao: 'b', dataHora: new Date('2026-06-10T10:00:00Z') }), // Wednesday
      ],
      [janela()],
      '2026-06-08',
      '2026-06-14',
      '2026-06-15',
    );

    expect(resumoSemanal).toEqual([
      { semanaInicio: '2026-06-08', diasConcluidos: 2, frequenciaEsperada: 3 },
    ]);
  });
});

describe('calcularAdesao', () => {
  it('returns null percentual when the patient has no prescription windows', () => {
    expect(calcularAdesao([], [], '2026-06-15')).toEqual({
      diasConcluidos: 0,
      diasEsperados: 0,
      percentual: null,
    });
  });

  it('returns null percentual when the only window starts in the future (nothing resolved yet)', () => {
    const result = calcularAdesao(
      [],
      [janela({ inicio: '2026-07-01', fim: '2026-07-31' })],
      '2026-06-15',
    );

    expect(result).toEqual({ diasConcluidos: 0, diasEsperados: 0, percentual: null });
  });

  it('tallies concluido/falhado/ignorado days and excludes pendente days from the percentage', () => {
    const result = calcularAdesao(
      [
        sessao({ idSessao: 'a', dataHora: new Date('2026-06-01T10:00:00Z') }), // concluido
        sessao({
          idSessao: 'b',
          status: SessaoStatus.FALHADO,
          dataHora: new Date('2026-06-02T10:00:00Z'),
        }),
        sessao({
          idSessao: 'c',
          status: SessaoStatus.INICIADO,
          dataHora: new Date('2026-06-03T10:00:00Z'),
        }), // past + iniciado -> falhado
        // 2026-06-04 through 2026-06-10: no sessions -> ignorado
      ],
      [janela({ inicio: '2026-06-01', fim: '2026-06-30' })],
      '2026-06-11',
    );

    expect(result).toEqual({ diasConcluidos: 1, diasEsperados: 10, percentual: 10 });
  });

  it('excludes days past an expired prescription window from diasEsperados', () => {
    const result = calcularAdesao(
      [sessao({ dataHora: new Date('2026-06-03T10:00:00Z') })],
      [janela({ inicio: '2026-06-01', fim: '2026-06-05' })],
      '2026-06-15',
    );

    // Only 2026-06-01..05 are inside the window; 06-06..06-14 are past but sem_plano, 06-15 is pendente.
    expect(result).toEqual({ diasConcluidos: 1, diasEsperados: 5, percentual: 20 });
  });

  it('does not double-count a day covered by two overlapping prescription windows', () => {
    const result = calcularAdesao(
      [],
      [
        janela({ inicio: '2026-06-01', fim: '2026-06-10' }),
        janela({ inicio: '2026-06-05', fim: '2026-06-15' }),
      ],
      '2026-06-16',
    );

    // 2026-06-01..15 (15 distinct days) are past and inside at least one window -> ignorado each.
    expect(result).toEqual({ diasConcluidos: 0, diasEsperados: 15, percentual: 0 });
  });
});
