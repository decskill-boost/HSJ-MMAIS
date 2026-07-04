import { supabase } from "./supabaseClient";
import { apiClient } from "./apiClient";

// --- INTERFACES DE TIPOS ---
export interface ExercicioDoPlano {
  id_exercicio: string;
  nome_exercicio: string;
  duracao_segundos: number;
  dificuldade_clinica: number;
  recompensa_xp: number;
  url_video: string;
}

export interface PlanoAtivo {
  id_plano: string;
  frequencia_semanal: number;
  notas_medicas: string;
  exercicios: ExercicioDoPlano[];
}

export const planosService = {
  // LER o plano ativo de um paciente (via Supabase)
  getPlanoAtivoPorPaciente: async (
    idPaciente: string,
  ): Promise<PlanoAtivo | null> => {
    const { data, error } = await supabase
      .from("prescricoes")
      .select(
        `
        id_prescricao,
        frequencia_semanal,
        notas_medicas,
        exercicios (
          id_exercicio,
          nome_exercicio,
          duracao_segundos,
          dificuldade_clinica,
          recompensa_xp,
          url_video
        )
      `,
      )
      .eq("id_paciente", idPaciente)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar o plano do paciente:", error.message);
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id_plano: data.id_prescricao,
      frequencia_semanal: data.frequencia_semanal,
      notas_medicas: data.notas_medicas,
      exercicios: (data.exercicios as unknown as ExercicioDoPlano[]) || [],
    };
  },

  // CRIAR um plano (prescrição) através do backend
  criarPlano: async (dados: {
    id_paciente: string;
    id_medico: string;
    frequencia_semanal: number;
    data_validade: string | null;
    notas_medicas: string;
    exercicios: string[]; // lista de id_exercicio
  }): Promise<void> => {
    await apiClient.post("/prescricoes", dados);
  },
};