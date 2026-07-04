export class CreatePrescricaoDto {
  id_paciente: string;
  id_medico: string;
  frequencia_semanal: number;
  data_validade: string | null;
  notas_medicas: string;
  exercicios: string[]; // lista de id_exercicio
}