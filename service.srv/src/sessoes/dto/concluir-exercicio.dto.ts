export interface ConcluirExercicioDto {
  id_exercicio: string;
  id_prescricao: string;
  id_sessao?: string;
  esforco_1_a_10?: number;
  diversao_1_a_5?: number;
  duracao?: number;
}
