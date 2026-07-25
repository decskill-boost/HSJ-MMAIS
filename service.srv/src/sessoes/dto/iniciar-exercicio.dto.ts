import { IsUUID } from 'class-validator';

export class IniciarExercicioDto {
  @IsUUID(undefined, { message: 'Identificador de exercício inválido.' })
  id_exercicio: string;

  @IsUUID(undefined, { message: 'Identificador de prescrição inválido.' })
  id_prescricao: string;
}
