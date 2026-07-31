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

  // `id_medico` NÃO se declara aqui de propósito.
  //
  // Quem prescreve é quem está autenticado: o id vem do `sub` do token
  // (`@CurrentUser()` no controlador), nunca do corpo do pedido. Enquanto era um
  // campo do DTO, um clínico podia registar um plano em nome de outro colega
  // apenas trocando o valor que o browser enviava.
  //
  // O `whitelist: true` do ValidationPipe global descarta o `id_medico` que o
  // frontend continua a mandar, sem erro — por isso a troca é compatível.

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

  @IsOptional()
  @IsString()
  nome?: string | null;

  // União de string simples ou objeto com duração: validada como lista não
  // vazia; a forma de cada item é tratada no serviço.
  @IsArray({ message: 'A lista de exercícios é inválida.' })
  @ArrayNotEmpty({ message: 'O plano tem de ter pelo menos um exercício.' })
  exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
}
