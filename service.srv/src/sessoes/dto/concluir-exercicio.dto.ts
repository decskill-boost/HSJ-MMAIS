import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Auto-relato da criança depois do treino. Era uma interface sem validação:
 * um esforço de 500 ou uma frequência cardíaca negativa entravam na base de
 * dados e apareciam ao corpo clínico como leitura verdadeira.
 */
export class ConcluirExercicioDto {
  @IsUUID(undefined, { message: 'Identificador de exercício inválido.' })
  id_exercicio: string;

  /**
   * Um treino pode não pertencer a plano nenhum (biblioteca livre, página de
   * demonstração) e o cliente envia string vazia nesses casos — é assim desde
   * sempre, porque o serviço passa tudo por `cleanUuid`, que trata '' como
   * «sem plano». Aceitam-se portanto '' e a ausência do campo; qualquer outro
   * valor tem de ser um UUID de um plano standard ou do próprio paciente (a
   * pertença é confirmada no `SessoesService`).
   */
  @IsOptional()
  @ValidateIf((o: { id_prescricao?: string }) => o.id_prescricao !== '')
  @IsUUID(undefined, { message: 'Identificador de prescrição inválido.' })
  id_prescricao?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'Identificador de sessão inválido.' })
  id_sessao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10, { message: 'O esforço vai de 1 a 10.' })
  esforco_1_a_10?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5, { message: 'A diversão vai de 1 a 5.' })
  diversao_1_a_5?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400, { message: 'A duração não pode passar de 24 horas.' })
  duracao?: number;

  @IsOptional()
  @IsBoolean()
  teve_problemas?: boolean;

  // Nota: o texto que a criança escreve a explicar o problema ainda NÃO tem
  // coluna na tabela `sessoes_realizadas`. Ver
  // service.srv/database/2026-07-25-descricao-problema.sql antes de o aceitar
  // aqui — sem a coluna, aceitá-lo seria prometer guardar e deitar fora.

  @IsOptional()
  @IsBoolean()
  participacao_familiares?: boolean;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300, { message: 'Frequência cardíaca fora do intervalo plausível.' })
  fc_maxima?: number;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300, { message: 'Frequência cardíaca fora do intervalo plausível.' })
  fc_media?: number;
}
