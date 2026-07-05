import { supabase } from "./supabaseClient";

export interface AvaliacaoSessao {
  id_paciente: string;
  id_exercicio: string;
  id_prescricao: string;
  duracao: number;
  diversao_1_a_5: number;
  esforco_1_a_10: number;
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
    });
    if (error) throw new Error(error.message);
  },
};