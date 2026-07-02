import { supabase } from "./supabaseClient";

// --- INTERFACES DE TIPOS (Mudou para Plano) ---
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

// --- SERVIÇO COM NOMES DE PLANO ---
export const planosService = {
  getPlanoAtivoPorPaciente: async (
    idPaciente: string,
  ): Promise<PlanoAtivo | null> => {
    // ATENÇÃO: O .from() e o .select() mantêm os nomes físicos da BD
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
};
