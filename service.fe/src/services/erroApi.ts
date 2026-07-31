import axios from "axios";

/**
 * Mensagem legível a partir de uma falha do `apiClient`.
 *
 * O supabase-js devolvia `{ data, error }` e os ecrãs mostravam
 * `error.message`; o axios lança. Sem esta conversão, o que aparecia ao
 * utilizador era "Request failed with status code 409" em vez do motivo que o
 * servidor explica em português (por exemplo, "Não é possível eliminar um
 * plano que já tem treinos associados.").
 *
 * O NestJS serializa os erros como `{ statusCode, message, error }`, e o
 * `ValidationPipe` põe em `message` um ARRAY de mensagens — daí os dois casos.
 *
 * Vive num módulo próprio porque é usada tanto pelos serviços como pelos
 * ecrãs: já existiram quatro cópias quase iguais desta função, e é assim que
 * duas delas acabam a divergir sem ninguém dar por isso.
 */
export function mensagemDeErro(erro: unknown, alternativa: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as
      | { message?: string | string[] }
      | string
      | undefined;

    if (typeof corpo === "string" && corpo.trim() !== "") {
      return corpo;
    }

    const mensagem =
      corpo && typeof corpo === "object" ? corpo.message : undefined;

    if (Array.isArray(mensagem) && mensagem.length > 0) {
      return mensagem.join(", ");
    }
    if (typeof mensagem === "string" && mensagem.trim() !== "") {
      return mensagem;
    }
    return erro.message || alternativa;
  }

  if (erro instanceof Error && erro.message) {
    return erro.message;
  }

  return alternativa;
}

/**
 * Reembrulha uma falha do axios num `Error` cuja `message` é já a do servidor.
 *
 * Assim os ecrãs que fazem `e instanceof Error ? e.message : "..."` — o padrão
 * que herdaram do supabase-js — continuam a mostrar a mensagem certa sem
 * precisarem de saber que por baixo passou a estar axios. A causa original
 * segue em `cause`, para não se perder o estado HTTP no diagnóstico.
 */
export function erroDaApi(erro: unknown, alternativa: string): Error {
  return new Error(mensagemDeErro(erro, alternativa), { cause: erro });
}
