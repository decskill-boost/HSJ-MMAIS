import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class IniciarExercicioDto {
  @IsUUID(undefined, { message: 'Identificador de exercício inválido.' })
  id_exercicio: string;

  /**
   * Um treino pode não pertencer a plano nenhum (biblioteca livre, página de
   * demonstração) e o cliente envia string vazia nesses casos — é assim desde
   * sempre, porque o serviço passa tudo por `cleanUuid`, que trata '' como
   * «sem plano». Aceitam-se portanto '' e a ausência do campo; qualquer outro
   * valor tem de ser um UUID.
   */
  @IsOptional()
  @ValidateIf((o: { id_prescricao?: string }) => o.id_prescricao !== '')
  @IsUUID(undefined, { message: 'Identificador de prescrição inválido.' })
  id_prescricao?: string;
}
