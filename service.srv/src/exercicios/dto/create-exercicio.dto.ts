import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { referenciaDoVideo } from '../../armazenamento/video.util';

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
  @Max(500, { message: 'A recompensa em XP não pode ultrapassar 500.' })
  recompensa_xp?: number;

  // O ecrã de edição devolve o link assinado que recebeu: volta a ser `gs://`
  // antes de validar (o link nem cabe nos 255) e antes de gravar.
  @IsOptional()
  @Transform(({ value }) => referenciaDoVideo(value))
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
