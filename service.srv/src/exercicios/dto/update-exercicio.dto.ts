import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Edição de um exercício da biblioteca: os mesmos campos do
 * `CreateExercicioDto`, todos opcionais.
 *
 * Antes o corpo do pedido era tipado como `Partial<Exercicio>`, que em tempo
 * de execução chega ao `ValidationPipe` como `Object` — e o pipe ignora tipos
 * nativos. Resultado: o único endpoint de escrita da biblioteca ficava sem
 * validação nenhuma, e o cliente podia escrever qualquer coluna da tabela.
 */
export class UpdateExercicioDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome_exercicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoria?: string;

  @IsOptional()
  @IsInt({ message: 'A duração tem de ser um número inteiro de segundos.' })
  @Min(0, { message: 'A duração não pode ser negativa.' })
  duracao_segundos?: number;

  @IsOptional()
  @IsInt({ message: 'A recompensa em XP tem de ser um número inteiro.' })
  @Min(0, { message: 'A recompensa em XP não pode ser negativa.' })
  @Max(500, { message: 'A recompensa em XP não pode ultrapassar 500.' })
  recompensa_xp?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  url_video?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dificuldade_clinica?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  materiais_necessarios?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  condicao_paciente?: string;

  @IsOptional()
  @IsInt({ message: 'As repetições têm de ser um número inteiro.' })
  @Min(0, { message: 'As repetições não podem ser negativas.' })
  repeticoes?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
