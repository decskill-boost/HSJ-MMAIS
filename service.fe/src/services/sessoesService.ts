import { apiClient } from "./apiClient";
import { erroDaApi } from "./erroApi";

export interface IniciarSessao {
  id_exercicio: string;
  id_prescricao: string;
}

export interface IniciarSessaoResultado {
  sessionId: string;
  alreadyCompletedToday: boolean;
}

export interface AvaliacaoSessao {
  id_exercicio: string;
  id_prescricao: string;
  id_sessao?: string;
  duracao: number;
  /** Só quando a criança responde ao questionário. Nos exercícios intermédios
   *  fica por preencher — inventar um valor seria dado clínico falso. */
  diversao_1_a_5?: number;
  esforco_1_a_10?: number;
  teve_problemas?: boolean;
  participacao_familiares?: boolean;
  fc_maxima?: number;
  fc_media?: number;
}

export interface ConclusaoResultado {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  xpForNextLevel: number;
  progressToNextLevel: number;
  streakAtual: number;
  sessionId: string;
  alreadyCompletedToday: boolean;
}

/**
 * Forma achatada de `GET /api/sessoes/minhas`. O exercício vem em campos de
 * topo (`nome_exercicio`, `recompensa_xp`) e não embutido como o PostgREST o
 * devolvia.
 *
 * `data_hora` é hora de parede, sem sufixo de fuso ("2026-07-28T10:00:00.000"),
 * exatamente como antes — o ecrã continua a lê-la como hora local.
 */
interface SessaoMinhaResposta {
  id_sessao: string;
  data_hora: string;
  duracao: number | null;
  esforco_1_a_10: number | null;
  nome_exercicio: string;
  recompensa_xp: number;
}

/**
 * Uma linha do histórico, na mesma forma aninhada que o ecrã «O meu progresso»
 * já lia do PostgREST. O achatamento da API é reconvertido aqui para o ecrã não
 * mudar.
 */
export interface SessaoHistorico {
  id_sessao: string;
  data_hora: string;
  duracao: number | null;
  exercicios: {
    nome_exercicio: string;
    recompensa_xp: number;
  } | null;
}

export const sessoesService = {
  iniciarSessao: async (dados: IniciarSessao): Promise<IniciarSessaoResultado> => {
    const response = await apiClient.post<IniciarSessaoResultado>(
      "/sessoes/iniciar",
      dados,
    );
    return response.data;
  },

  registarSessao: async (dados: AvaliacaoSessao): Promise<ConclusaoResultado> => {
    const response = await apiClient.post<ConclusaoResultado>(
      "/sessoes/concluir",
      dados,
    );
    return response.data;
  },

  /**
   * Histórico de treinos concluídos da própria criança.
   *
   * `GET /api/sessoes/minhas` tira o paciente do token verificado — não há
   * parâmetro por onde pedir o histórico de outra criança. O `idPaciente`
   * continua na assinatura porque é quem está autenticado e serve de guarda:
   * sem utilizador não há histórico para pedir.
   *
   * O filtro passou de `concluido = true` para `status = 'concluido'` no
   * servidor; a ordenação continua por `data_hora` decrescente.
   */
  getHistorico: async (idPaciente: string): Promise<SessaoHistorico[]> => {
    if (!idPaciente) return [];

    try {
      const response = await apiClient.get<SessaoMinhaResposta[]>(
        "/sessoes/minhas",
      );

      // O PostgREST embutia o exercício; a API devolve-o achatado. Repor o
      // aninhamento evita mexer no ecrã e mantém o "Exercício"/"0 XP" de
      // reserva a funcionar quando o exercício já não existe.
      return (response.data ?? []).map((s) => ({
        id_sessao: s.id_sessao,
        data_hora: s.data_hora,
        duracao: s.duracao,
        exercicios: {
          nome_exercicio: s.nome_exercicio,
          recompensa_xp: s.recompensa_xp,
        },
      }));
    } catch (erro) {
      throw erroDaApi(erro, "Erro ao carregar o histórico de treinos.");
    }
  },
};
