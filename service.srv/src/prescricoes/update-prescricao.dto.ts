export class UpdatePrescricaoDto {
  frequencia_semanal: number;
  data_validade?: string | null;
  notas_medicas?: string;
  dificuldade?: string;
  condicao_paciente?: string;
  condicao_clinica?: string | null;
  exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
}
