import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Valores clínicos entram por aqui. Antes nada era validado: uma frequência
 * negativa ou um texto onde se esperava um número chegava crua à base de dados.
 */
export class CreatePrescricaoDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'Identificador de paciente inválido.' })
  id_paciente?: string | null;

  @IsUUID(undefined, { message: 'Identificador de médico inválido.' })
  id_medico: string;

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
  @IsBoolean()
  is_standard?: boolean;

  @IsOptional()
  @IsString()
  dificuldade?: string;

  @IsOptional()
  @IsString()
  condicao_paciente?: string;

  @IsOptional()
  @IsString()
  condicao_clinica?: string | null;

  // União de string simples ou objeto com duração: validada como lista não
  // vazia; a forma de cada item é tratada no serviço.
  @IsArray({ message: 'A lista de exercícios é inválida.' })
  @ArrayNotEmpty({ message: 'O plano tem de ter pelo menos um exercício.' })
  exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
}
