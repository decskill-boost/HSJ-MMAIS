import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Criação de um exercício da biblioteca.
 *
 * Existe por causa do `ValidationPipe` global com `whitelist: true`: com o
 * controlador a receber a entidade `Exercicio` — que só tem decoradores do
 * TypeORM, nenhum de validação — a lista branca ficava vazia e o corpo do
 * pedido chegava ao serviço como `{}`. Criar exercícios gravava linhas vazias.
 *
 * Os limites abaixo são os que a própria tabela já declara (comprimentos das
 * colunas, obrigatoriedade, inteiros não negativos). Não há aqui nenhuma regra
 * clínica nova.
 */
export class CreateExercicioDto {
  @IsString()
  @MaxLength(255)
  nome_exercicio: string;

  @IsString()
  @MaxLength(255)
  categoria: string;

  @IsInt({ message: 'A duração tem de ser um número inteiro de segundos.' })
  @Min(0, { message: 'A duração não pode ser negativa.' })
  duracao_segundos: number;

  @IsOptional()
  @IsInt({ message: 'A recompensa em XP tem de ser um número inteiro.' })
  @Min(0, { message: 'A recompensa em XP não pode ser negativa.' })
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
