import axios from "axios";
import { apiClient } from "./apiClient";

interface UploadDeVideo {
  urlUpload: string;
  cabecalhos: Record<string, string>;
  urlPublica: string;
}

/**
 * Envia o vídeo de um exercício para o bucket do Google Cloud Storage e devolve
 * o URL público, que é o que se grava em `url_video`.
 *
 * O ficheiro não passa pelo backend (na Vercel um pedido não pode ter mais de
 * 4,5 MB): o backend só assina um URL de upload e o browser envia o vídeo
 * direto ao bucket. O PUT sai pelo `axios` simples e não pelo `apiClient` de
 * propósito — o token da sessão não é para o Google, e um `Authorization` a
 * mais faz o GCS recusar o URL assinado.
 */
export async function enviarVideo(
  ficheiro: File,
  aoProgredir?: (percentagem: number) => void,
): Promise<string> {
  const { data } = await apiClient.post<UploadDeVideo>("/exercicios/videos", {
    tipo: ficheiro.type,
  });

  await axios.put(data.urlUpload, ficheiro, {
    headers: data.cabecalhos,
    onUploadProgress: (evento) => {
      if (evento.total) {
        aoProgredir?.(Math.round((evento.loaded / evento.total) * 100));
      }
    },
  });

  return data.urlPublica;
}
