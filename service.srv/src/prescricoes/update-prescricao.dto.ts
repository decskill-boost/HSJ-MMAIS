import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePrescricaoDto {
  @IsInt({ message: 'A frequência semanal tem de ser um número inteiro.' })
  @Min(1, { message: 'A frequência semanal tem de ser pelo menos 1.' })
  @Max(21, {
    message: 'A frequência semanal não pode passar de 21 (3 por dia).',
  })
  frequencia_semanal: number;

  @IsOptional()
  @IsString()
  data_validade?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'As notas médicas são demasiado longas.' })
  notas_medicas?: string;

  @IsOptional()
  @IsString()
  dificuldade?: string;

  @IsOptional()
  @IsString()
  condicao_paciente?: string;

  @IsOptional()
  @IsString()
  condicao_clinica?: string | null;

  @IsOptional()
  @IsString()
  nome?: string | null;

  @IsArray({ message: 'A lista de exercícios é inválida.' })
  @ArrayNotEmpty({ message: 'O plano tem de ter pelo menos um exercício.' })
  exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
}
