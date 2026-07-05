import { supabase } from "./supabaseClient";
import { apiClient } from "./apiClient";

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
  getTodosPlanosPorPaciente: async (
    idPaciente: string,
  ): Promise<{ ativo: PlanoAtivo | null; historico: PlanoAtivo[] }> => {
    // 1. Buscar prescrições
    const { data: prescricoes, error: errP } = await supabase
      .from("prescricoes")
      .select("id_prescricao, frequencia_semanal, notas_medicas, ativo")
      .eq("id_paciente", idPaciente);

    if (errP) throw new Error(errP.message);
    if (!prescricoes || prescricoes.length === 0)
      return { ativo: null, historico: [] };

    // 2. Buscar relações prescrição-exercício
    const ids = prescricoes.map((p) => p.id_prescricao);
    const { data: peData, error: errPE } = await supabase
      .from("prescricoes_exercicios")
      .select("id_prescricao, id_exercicio")
      .in("id_prescricao", ids);

    if (errPE) throw new Error(errPE.message);
    if (!peData || peData.length === 0) {
      const ativos = prescricoes.filter((p) => p.ativo);
      const inativos = prescricoes.filter((p) => !p.ativo);
      return {
        ativo: ativos[0]
          ? {
              id_plano: ativos[0].id_prescricao,
              frequencia_semanal: ativos[0].frequencia_semanal,
              notas_medicas: ativos[0].notas_medicas,
              exercicios: [],
            }
          : null,
        historico: inativos.map((p) => ({
          id_plano: p.id_prescricao,
          frequencia_semanal: p.frequencia_semanal,
          notas_medicas: p.notas_medicas,
          exercicios: [],
        })),
      };
    }

    // 3. Buscar exercícios pelos IDs
    const exercicioIds = [...new Set(peData.map((pe) => pe.id_exercicio))];
    const { data: exerciciosData, error: errE } = await supabase
      .from("exercicios")
      .select(
        "id_exercicio, nome_exercicio, duracao_segundos, dificuldade_clinica, recompensa_xp, url_video",
      )
      .in("id_exercicio", exercicioIds);

    if (errE) throw new Error(errE.message);

console.log("1. Prescrições:", prescricoes);
console.log("2. peData:", peData);
console.log("3. exerciciosData:", exerciciosData);

    // 4. Juntar tudo
    const mapPlano = (p: any): PlanoAtivo => ({
      id_plano: p.id_prescricao,
      frequencia_semanal: p.frequencia_semanal,
      notas_medicas: p.notas_medicas,
      exercicios: peData
        .filter((pe) => pe.id_prescricao === p.id_prescricao)
        .map((pe) =>
          (exerciciosData ?? []).find(
            (e) => e.id_exercicio === pe.id_exercicio,
          ),
        )
        .filter(Boolean) as ExercicioDoPlano[],
    });

    const ativos = prescricoes.filter((p) => p.ativo).map(mapPlano);
    const historico = prescricoes.filter((p) => !p.ativo).map(mapPlano);

    return { ativo: ativos[0] ?? null, historico };
  },

  // CRIAR um plano (prescrição) através do backend
  criarPlano: async (dados: {
    id_paciente: string;
    id_medico: string;
    frequencia_semanal: number;
    data_validade: string | null;
    notas_medicas: string;
    exercicios: string[];
  }): Promise<void> => {
    await apiClient.post("/prescricoes", dados);
  },
};