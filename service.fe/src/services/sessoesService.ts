import { supabase } from "./supabaseClient";

export interface AvaliacaoSessao {
  id_paciente: string;
  id_exercicio: string;
  id_prescricao: string;
  duracao: number;
  diversao_1_a_5: number;
  esforco_1_a_10: number;
  bpm_medio?: number | null;
  bpm_maximo?: number | null;
  problemas_treino?: boolean | null;
  companhia?: boolean | null;
  dificuldade_crianca?: number | null;
  descricao_problema?: string | null;
}

export const sessoesService = {
  registarSessao: async (dados: AvaliacaoSessao): Promise<void> => {
    const { error } = await supabase.from("sessoes_realizadas").insert({
      id_sessao: crypto.randomUUID(),
      id_paciente: dados.id_paciente,
      id_exercicio: dados.id_exercicio,
      id_prescricao: dados.id_prescricao,
      data_hora: new Date().toISOString(),
      duracao: dados.duracao,
      concluido: true,
      diversao_1_a_5: dados.diversao_1_a_5,
      esforco_1_a_10: dados.esforco_1_a_10,
      bpm_medio: dados.bpm_medio ?? null,
      bpm_maximo: dados.bpm_maximo ?? null,
      problemas_treino: dados.problemas_treino ?? null,
      companhia: dados.companhia ?? null,
      dificuldade_crianca: dados.dificuldade_crianca ?? null,
      descricao_problema: dados.descricao_problema ?? null,
    });
    if (error) throw new Error(error.message);
  },
};