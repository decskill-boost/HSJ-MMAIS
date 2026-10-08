/**
 * Os vídeos dos exercícios vivem num bucket PRIVADO do GCS. Na base de dados,
 * `url_video` guarda só a referência ao objeto — `gs://<bucket>/<objeto>` — e
 * o cliente nunca a vê: à saída da API é trocada por um link de leitura
 * assinado e temporário (ver `AssinarVideosInterceptor`).
 *
 * O ecrã de edição devolve o exercício inteiro, incluindo o link assinado que
 * recebeu. Gravá-lo assim deixava na base de dados um URL que expira em horas
 * (e que nem cabe nos 255 caracteres da coluna), por isso as escritas passam
 * por aqui e o link volta a ser a referência `gs://`.
 *
 * Tudo o que não seja um link assinado do GCS passa intacto — os vídeos
 * antigos do Supabase incluídos.
 */
export function referenciaDoVideo(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor;

  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return valor;
  }

  if (
    url.hostname !== 'storage.googleapis.com' ||
    !url.searchParams.has('X-Goog-Signature')
  ) {
    return valor;
  }

  const [, bucket, ...objeto] = url.pathname.split('/');
  return `gs://${bucket}/${objeto.map(decodeURIComponent).join('/')}`;
}
