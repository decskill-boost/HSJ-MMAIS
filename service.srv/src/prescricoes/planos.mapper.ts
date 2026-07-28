import {
  paraNumero,
  paraNumeroOuNulo,
  paraTimestampSemFuso,
} from './data.util';
import type {
  ExercicioDoPlano,
  PlanoDoPaciente,
  PlanoGerido,
  PlanoStandard,
} from './planos.types';

/**
 * Uma linha do LEFT JOIN prescricoes → prescricoes_exercicios → exercicios.
 *
 * O LEFT JOIN é essencial: um plano SEM exercícios continua a produzir uma
 * linha (com os campos `ex_*` a null) e por isso nunca desaparece da resposta.
 * Era esse o defeito do caminho antigo, que fazia três viagens ao Supabase e
 * perdia o plano em vigor quando a tabela de junção vinha vazia.
 */
export interface LinhaPlano {
  id_prescricao: string;
  frequencia_semanal: number | string | null;
  notas_medicas: string | null;
  data_inicio: Date | string | null;
  data_validade: Date | string | null;
  data_fim: Date | string | null;
  ativo: boolean | null;
  dificuldade: string | null;
  condicao_paciente: string | null;
  condicao_clinica: string | null;
  is_standard: boolean | null;
  id_paciente: string | null;
  ex_id_exercicio: string | null;
  ex_nome_exercicio: string | null;
  ex_duracao_segundos: number | string | null;
  ex_dificuldade_clinica: string | null;
  ex_recompensa_xp: number | string | null;
  ex_url_video: string | null;
  ex_repeticoes: number | string | null;
  ex_materiais_necessarios: string | null;
}

/** Linha da consulta agregada da lista de gestão (E4). */
export interface LinhaPlanoGerido {
  id_prescricao: string;
  frequencia_semanal: number | string | null;
  notas_medicas: string | null;
  data_inicio: Date | string | null;
  data_validade: Date | string | null;
  ativo: boolean | null;
  dificuldade: string | null;
  condicao_paciente: string | null;
  is_standard: boolean | null;
  id_paciente: string | null;
  nome_paciente: string | null;
  total_exercicios: number | string | null;
}

/** Agrupamento intermédio: um plano com a lista de exercícios já reunida. */
export interface PlanoAgrupado {
  linha: LinhaPlano;
  exercicios: ExercicioDoPlano[];
}

const exercicioDaLinha = (linha: LinhaPlano): ExercicioDoPlano | null => {
  if (!linha.ex_id_exercicio) {
    return null;
  }
  return {
    id_exercicio: linha.ex_id_exercicio,
    nome_exercicio: linha.ex_nome_exercicio ?? '',
    // Já vem do COALESCE(prescricoes_exercicios.duracao_segundos,
    // exercicios.duracao_segundos) feito na consulta.
    duracao_segundos: paraNumero(linha.ex_duracao_segundos),
    dificuldade_clinica: linha.ex_dificuldade_clinica ?? 'facil',
    recompensa_xp: paraNumero(linha.ex_recompensa_xp),
    url_video: linha.ex_url_video ?? null,
    repeticoes: paraNumeroOuNulo(linha.ex_repeticoes),
    materiais_necessarios: linha.ex_materiais_necessarios ?? null,
  };
};

/**
 * Junta as linhas do JOIN por prescrição, mantendo a ordem em que a base de
 * dados as devolveu (a ordenação dos planos é feita no SQL).
 */
export function agruparPlanos(linhas: LinhaPlano[]): PlanoAgrupado[] {
  const porPrescricao = new Map<string, PlanoAgrupado>();

  for (const linha of linhas) {
    let plano = porPrescricao.get(linha.id_prescricao);
    if (!plano) {
      plano = { linha, exercicios: [] };
      porPrescricao.set(linha.id_prescricao, plano);
    }
    const exercicio = exercicioDaLinha(linha);
    if (
      exercicio &&
      !plano.exercicios.some((e) => e.id_exercicio === exercicio.id_exercicio)
    ) {
      plano.exercicios.push(exercicio);
    }
  }

  return [...porPrescricao.values()];
}

/** Um plano é «em vigor» exatamente com o critério que o frontend já usava. */
export const estaAtivo = (linha: { ativo: boolean | null }): boolean =>
  linha.ativo === true;

export function paraPlanoDoPaciente(plano: PlanoAgrupado): PlanoDoPaciente {
  const { linha } = plano;
  return {
    id_plano: linha.id_prescricao,
    frequencia_semanal: paraNumero(linha.frequencia_semanal),
    notas_medicas: linha.notas_medicas ?? null,
    data_inicio: paraTimestampSemFuso(linha.data_inicio),
    data_validade: paraTimestampSemFuso(linha.data_validade),
    data_fim: paraTimestampSemFuso(linha.data_fim),
    ativo: estaAtivo(linha),
    dificuldade: linha.dificuldade ?? 'facil',
    condicao_paciente: linha.condicao_paciente ?? 'A',
    exercicios: plano.exercicios,
  };
}

/**
 * Os planos do histórico saem SEM notas médicas.
 *
 * O ecrã da criança (`PlanosPaciente.tsx`) filtra por `ativo === true` e nunca
 * mostra o histórico — mandar para o browser dela o texto clínico de planos já
 * cancelados é enviar indicação médica retirada, sem nada que a leia. A chave
 * mantém-se presente (a null) para a forma da resposta não mudar.
 */
export function paraPlanoDoHistorico(plano: PlanoAgrupado): PlanoDoPaciente {
  return { ...paraPlanoDoPaciente(plano), notas_medicas: null };
}

export function paraPlanoStandard(plano: PlanoAgrupado): PlanoStandard {
  return {
    ...paraPlanoDoPaciente(plano),
    condicao_clinica: plano.linha.condicao_clinica ?? null,
    is_standard: plano.linha.is_standard === true,
  };
}

export function paraPlanoGerido(linha: LinhaPlanoGerido): PlanoGerido {
  return {
    id_plano: linha.id_prescricao,
    frequencia_semanal: paraNumero(linha.frequencia_semanal),
    notas_medicas: linha.notas_medicas ?? null,
    data_inicio: paraTimestampSemFuso(linha.data_inicio),
    data_validade: paraTimestampSemFuso(linha.data_validade),
    ativo: linha.ativo === true,
    dificuldade: linha.dificuldade ?? 'facil',
    condicao_paciente: linha.condicao_paciente ?? 'A',
    is_standard: linha.is_standard === true,
    id_paciente: linha.id_paciente ?? null,
    nome_paciente: linha.nome_paciente ?? null,
    total_exercicios: paraNumero(linha.total_exercicios),
  };
}
