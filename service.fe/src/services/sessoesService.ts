import { apiClient } from "./apiClient";
import { supabase } from "./supabaseClient";

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sessão inválida. Por favor, faça login novamente.");
  }
  return session.access_token;
}

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
  diversao_1_a_5: number;
  esforco_1_a_10: number;
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

export const sessoesService = {
  iniciarSessao: async (dados: IniciarSessao): Promise<IniciarSessaoResultado> => {
    const token = await getAccessToken();
    const response = await apiClient.post<IniciarSessaoResultado>(
      "/sessoes/iniciar",
      dados,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  registarSessao: async (dados: AvaliacaoSessao): Promise<ConclusaoResultado> => {
    const token = await getAccessToken();
    const response = await apiClient.post<ConclusaoResultado>(
      "/sessoes/concluir",
      dados,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  getHistorico: async (idPaciente: string) => {
    const { data, error } = await supabase
      .from("sessoes_realizadas")
      .select(`
        id_sessao,
        data_hora,
        duracao,
        exercicios (
          nome_exercicio,
          recompensa_xp
        )
      `)
      .eq("id_paciente", idPaciente)
      .eq("concluido", true)
      .order("data_hora", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};