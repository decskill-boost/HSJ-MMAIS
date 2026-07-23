import { apiClient } from "./apiClient";
import { supabase } from "./supabaseClient";

export interface Paciente {
  id_user: string;
  nome: string;
  email: string;
}

export interface PacienteDetalhe extends Paciente {
  nivel: number;
  xp: number;
  streak_atual: number;
}

export interface PacienteComAdesao {
  idUser: string;
  nome: string;
  email: string;
  adesaoPercentual: number | null;
}

export type SessaoStatus = "iniciado" | "concluido" | "falhado";
export type DiaStatus = "concluido" | "falhado" | "ignorado" | "pendente" | "sem_plano";

export interface SessaoResumo {
  idSessao: string;
  nomeExercicio: string;
  status: SessaoStatus;
  esforco: number | null;
  diversao: number | null;
  duracaoSegundos: number | null;
  hora: string;
  teveProblemas?: boolean;
  participacaoFamiliares?: boolean;
  fcMaxima?: number | null;
  fcMedia?: number | null;
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

export interface HistoricoResposta {
  dias: DiaHistorico[];
  resumoSemanal: ResumoSemanal[];
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessão inválida. Por favor, faça login novamente.");
  }

  return session.access_token;
}

export const pacientesService = {
  // Busca todos os utilizadores que são pacientes
  async getPacientes(): Promise<Paciente[]> {
    const token = await getAccessToken();
    const response = await apiClient.get<PacienteComAdesao[]>("/pacientes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.map((p) => ({
      id_user: p.idUser,
      nome: p.nome,
      email: p.email,
    }));
  },

  // Busca os dados básicos de um paciente para o cabeçalho do perfil
  async getPacienteById(id: string): Promise<PacienteDetalhe> {
    const { data, error } = await supabase
      .from("utilizadores")
      .select("id_user, nome, email, nivel, xp, streak_atual")
      .eq("id_user", id)
      .eq("tipo_utilizador", "paciente")
      .single();

    if (error) {
      console.error("Erro ao carregar paciente:", error.message);
      throw new Error(error.message);
    }

    return data;
  },

  // Lista de pacientes com percentagem de adesão — via API, protegido por role
  async getPacientesComAdesao(): Promise<PacienteComAdesao[]> {
    const token = await getAccessToken();
    const response = await apiClient.get<PacienteComAdesao[]>("/pacientes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Histórico de assiduidade (concluído/falhado/ignorado) — via API, protegido por role
  async getHistorico(id: string, from?: string, to?: string): Promise<HistoricoResposta> {
    const token = await getAccessToken();
    const response = await apiClient.get<HistoricoResposta>(
      `/pacientes/${id}/historico`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { from, to },
      },
    );
    return response.data;
  },
};