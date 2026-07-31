/**
 * As datas das prescrições (`data_inicio`, `data_validade`, `data_fim`) estão
 * guardadas em colunas `timestamp` SEM fuso horário. Até aqui o frontend lia-as
 * pelo PostgREST, que devolve o texto tal como está na base de dados
 * ("2025-06-01T10:00:00", sem "Z"), e o browser interpreta-o como hora local.
 *
 * Se o backend passasse a responder com `toISOString()` (UTC, com "Z"), a mesma
 * linha aparecia deslocada uma hora no horário de verão — e `data_validade`
 * chega a ser cortada com `.slice(0, 10)` no ecrã de edição, onde essa hora a
 * mais faz mudar o DIA apresentado ao clínico.
 *
 * Por isso serializa-se sem fuso, exatamente com os componentes que estão
 * gravados. O driver do Postgres lê `timestamp` como data na hora local do
 * processo, logo os componentes locais são os originais.
 */
export function paraTimestampSemFuso(
  valor: Date | string | null | undefined,
): string | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  // Alguns caminhos do driver devolvem já texto; nesse caso não se toca nele.
  if (typeof valor === 'string') {
    return valor;
  }

  if (Number.isNaN(valor.getTime())) {
    return null;
  }

  const dois = (n: number) => String(n).padStart(2, '0');

  return (
    `${valor.getFullYear()}-${dois(valor.getMonth() + 1)}-${dois(valor.getDate())}` +
    `T${dois(valor.getHours())}:${dois(valor.getMinutes())}:${dois(valor.getSeconds())}`
  );
}

/** Converte valores numéricos que o driver possa devolver como texto (ex.: COUNT). */
export function paraNumero(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined) {
    return 0;
  }
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : 0;
}

/** Igual a `paraNumero`, mas mantém a ausência de valor como `null`. */
export function paraNumeroOuNulo(
  valor: number | string | null | undefined,
): number | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}
