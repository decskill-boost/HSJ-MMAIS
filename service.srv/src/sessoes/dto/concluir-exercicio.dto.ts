export interface ConcluirExercicioDto {
  id_exercicio: string;
  id_prescricao: string;
  id_sessao?: string;
  esforco_1_a_10?: number;
  diversao_1_a_5?: number;
  duracao?: number;
  teve_problemas?: boolean;
  participacao_familiares?: boolean;
  fc_maxima?: number;
  fc_media?: number;
}
