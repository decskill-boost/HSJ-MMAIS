import { SessaoStatus } from '../entities/sessao-realizada.entity';
import { toLisbonDateKey } from '../sessoes/streak.util';

export enum DiaStatus {
  CONCLUIDO = 'concluido',
  FALHADO = 'falhado',
  IGNORADO = 'ignorado',
  PENDENTE = 'pendente',
  SEM_PLANO = 'sem_plano',
}

export interface SessaoParaHistorico {
  idSessao: string;
  nomeExercicio: string;
  status: SessaoStatus;
  esforco: number | null;
  diversao: number | null;
  duracaoSegundos: number | null;
  dataHora: Date;
}

/** A prescription's active window, in Lisbon calendar-date keys (YYYY-MM-DD). */
export interface PrescricaoWindow {
  inicio: string;
  fim: string;
  frequenciaSemanal: number;
}

export interface SessaoResumo {
  idSessao: string;
  nomeExercicio: string;
  status: SessaoStatus;
  esforco: number | null;
  diversao: number | null;
  duracaoSegundos: number | null;
  hora: string;
}

export interface DiaHistorico {
  data: string;
  status: DiaStatus;
  sessoes: SessaoResumo[];
}

export interface ResumoSemanal {
  semanaInicio: string;
  diasConcluidos: number;
  frequenciaEsperada: number;
}

export interface HistoricoResultado {
  dias: DiaHistorico[];
  resumoSemanal: ResumoSemanal[];
}

function isWithinWindow(dia: string, janela: PrescricaoWindow): boolean {
  return dia >= janela.inicio && dia <= janela.fim;
}

function listaDeDias(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const dias: string[] = [];
  let cursor = Date.UTC(fy, fm - 1, fd);
  const fim = Date.UTC(ty, tm - 1, td);
  while (cursor <= fim) {
    dias.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += 24 * 60 * 60 * 1000;
  }
  return dias;
}

/** Monday (ISO week start) of the week containing `dia`, as a YYYY-MM-DD key. */
function segundaFeiraDaSemana(dia: string): string {
  const [y, m, d] = dia.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const diaSemana = date.getUTCDay();
  const offsetParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  date.setUTCDate(date.getUTCDate() + offsetParaSegunda);
  return date.toISOString().slice(0, 10);
}

/** Classifies a single day given the sessions that fall on it and whether it's inside any prescription window. */
function classificarDia(
  sessoesDoDia: SessaoParaHistorico[],
  dentroDeAlgumaJanela: boolean,
  data: string,
  hoje: string,
): DiaStatus {
  if (sessoesDoDia.some((s) => s.status === SessaoStatus.CONCLUIDO)) {
    return DiaStatus.CONCLUIDO;
  }
  if (
    sessoesDoDia.some((s) => s.status === SessaoStatus.FALHADO) ||
    (data < hoje && sessoesDoDia.some((s) => s.status === SessaoStatus.INICIADO))
  ) {
    return DiaStatus.FALHADO;
  }
  if (data >= hoje) {
    return DiaStatus.PENDENTE;
  }
  if (dentroDeAlgumaJanela) {
    return DiaStatus.IGNORADO;
  }
  return DiaStatus.SEM_PLANO;
}

function agruparSessoesPorDiaLisboa(
  sessoes: SessaoParaHistorico[],
): Map<string, SessaoParaHistorico[]> {
  const sessoesPorDia = new Map<string, SessaoParaHistorico[]>();
  for (const sessao of sessoes) {
    const dia = toLisbonDateKey(sessao.dataHora);
    const lista = sessoesPorDia.get(dia) ?? [];
    lista.push(sessao);
    sessoesPorDia.set(dia, lista);
  }
  return sessoesPorDia;
}

export function deriveHistorico(
  sessoes: SessaoParaHistorico[],
  prescricaoWindows: PrescricaoWindow[],
  from: string,
  to: string,
  hoje: string,
): HistoricoResultado {
  const sessoesPorDia = agruparSessoesPorDiaLisboa(sessoes);

  const dias: DiaHistorico[] = listaDeDias(from, to).map((data) => {
    const sessoesDoDia = sessoesPorDia.get(data) ?? [];
    const dentroDeAlgumaJanela = prescricaoWindows.some((janela) =>
      isWithinWindow(data, janela),
    );
    const status = classificarDia(sessoesDoDia, dentroDeAlgumaJanela, data, hoje);

    return {
      data,
      status,
      sessoes: sessoesDoDia.map((s) => ({
        idSessao: s.idSessao,
        nomeExercicio: s.nomeExercicio,
        status: s.status,
        esforco: s.esforco,
        diversao: s.diversao,
        duracaoSegundos: s.duracaoSegundos,
        hora: s.dataHora.toISOString(),
      })),
    };
  });

  const resumoPorSemana = new Map<
    string,
    { diasConcluidos: number; frequenciaEsperada: number }
  >();
  for (const dia of dias) {
    const semanaInicio = segundaFeiraDaSemana(dia.data);
    const janelaAtiva = prescricaoWindows.find((janela) => isWithinWindow(dia.data, janela));
    const atual = resumoPorSemana.get(semanaInicio) ?? {
      diasConcluidos: 0,
      frequenciaEsperada: janelaAtiva?.frequenciaSemanal ?? 0,
    };
    if (dia.status === DiaStatus.CONCLUIDO) {
      atual.diasConcluidos += 1;
    }
    if (janelaAtiva && atual.frequenciaEsperada === 0) {
      atual.frequenciaEsperada = janelaAtiva.frequenciaSemanal;
    }
    resumoPorSemana.set(semanaInicio, atual);
  }

  const resumoSemanal: ResumoSemanal[] = Array.from(resumoPorSemana.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([semanaInicio, valores]) => ({ semanaInicio, ...valores }));

  return { dias, resumoSemanal };
}

export interface AdesaoResultado {
  diasConcluidos: number;
  diasEsperados: number;
  percentual: number | null;
}

/**
 * Overall adherence since a patient's earliest prescription window, without building
 * the full per-day/per-session breakdown deriveHistorico produces — cheaper when this
 * only needs to run for every patient in a clinic's list.
 */
export function calcularAdesao(
  sessoes: SessaoParaHistorico[],
  prescricaoWindows: PrescricaoWindow[],
  hoje: string,
): AdesaoResultado {
  if (prescricaoWindows.length === 0) {
    return { diasConcluidos: 0, diasEsperados: 0, percentual: null };
  }

  const from = prescricaoWindows.reduce(
    (min, w) => (w.inicio < min ? w.inicio : min),
    prescricaoWindows[0].inicio,
  );

  const sessoesPorDia = agruparSessoesPorDiaLisboa(sessoes);

  let diasConcluidos = 0;
  let diasEsperados = 0;
  for (const data of listaDeDias(from, hoje)) {
    const sessoesDoDia = sessoesPorDia.get(data) ?? [];
    const dentroDeAlgumaJanela = prescricaoWindows.some((janela) =>
      isWithinWindow(data, janela),
    );
    const status = classificarDia(sessoesDoDia, dentroDeAlgumaJanela, data, hoje);

    if (status === DiaStatus.CONCLUIDO || status === DiaStatus.FALHADO || status === DiaStatus.IGNORADO) {
      diasEsperados += 1;
      if (status === DiaStatus.CONCLUIDO) diasConcluidos += 1;
    }
  }

  const percentual = diasEsperados === 0 ? null : Math.round((diasConcluidos / diasEsperados) * 100);
  return { diasConcluidos, diasEsperados, percentual };
}
