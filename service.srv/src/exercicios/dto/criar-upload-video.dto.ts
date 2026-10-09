import { IsIn } from 'class-validator';
import {
  TIPOS_DE_VIDEO,
  type TipoDeVideo,
} from '../../armazenamento/armazenamento.service';

/**
 * Pedido de um URL de upload para o vídeo de um exercício. Só o tipo: o nome
 * do objeto é escolhido pelo servidor, e o tamanho máximo vai na assinatura.
 */
export class CriarUploadVideoDto {
  @IsIn(Object.keys(TIPOS_DE_VIDEO), {
    message: 'Formato inválido. Usa MP4 ou MOV.',
  })
  tipo: TipoDeVideo;
}
