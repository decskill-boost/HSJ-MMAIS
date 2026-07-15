export class CreatePrescricaoDto {
  id_paciente?: string | null;
  id_medico: string;
  frequencia_semanal: number;
  data_validade?: string | null;
  notas_medicas?: string;
  is_standard?: boolean;
  dificuldade?: string;
  condicao_clinica?: string | null;
  exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
}
