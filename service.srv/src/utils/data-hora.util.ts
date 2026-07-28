/**
 * Serialização de `sessoes_realizadas.data_hora`.
 *
 * Vive em `utils/` — e não dentro de um domínio — porque é usada tanto pelas
 * rotas do corpo clínico (`/pacientes`) como pelas da criança (`/sessoes`).
 * Terem-se escrito duas serializações diferentes para a MESMA coluna é
 * precisamente o defeito que este ficheiro único evita.
 *
 * A coluna é um `timestamp` SEM fuso horário: o que lá está guardado é hora de
 * parede, não um instante absoluto. Hoje o PostgREST devolve-a ao frontend
 * exatamente assim — «2026-07-28T10:00:00», sem sufixo — e todo o painel
 * clínico a interpreta como hora local: o `DashboardCorpoClinico.tsx` constrói
 * de propósito a fronteira dos 7 dias no mesmo formato, sem «Z», e o comentário
 * do próprio ficheiro explica porquê.
 *
 * Se o servidor respondesse com `toISOString()` (UTC, com «Z»), o instante
 * ficaria certo apenas enquanto o fuso do SERVIDOR fosse igual ao do browser.
 * Em produção não é: o servidor corre em UTC e as crianças estão em Lisboa, o
 * que punha o «último treino» uma hora à frente no horário de verão e fazia a
 * fronteira dos 7 dias deslizar — isto é, mudava a lista de crianças que o
 * painel «Precisam de atenção» sinaliza ao corpo clínico. Não é uma diferença
 * cosmética.
 *
 * O controlador de `pg` converte um `timestamp` sem fuso numa `Date` usando os
 * componentes LOCAIS do processo Node. Ao voltar a ler os componentes locais,
 * o valor faz ida e volta sem desvio, seja qual for o fuso do servidor.
 */
export function toTimestampSemFuso(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0');
  const tres = (n: number) => String(n).padStart(3, '0');

  return (
    `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}` +
    `T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}` +
    `.${tres(data.getMilliseconds())}`
  );
}

/**
 * Normaliza o que vem de um `getRawMany()` para `Date`. O controlador de `pg`
 * já devolve `Date` para a coluna `timestamp`, mas um agregado (`MAX(...)`)
 * pode chegar como texto consoante o controlador/versão — e uma data inválida
 * tem de sair como `null`, nunca como «Invalid Date» serializada.
 */
export function paraData(valor: unknown): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  if (typeof valor === 'string' && valor.length > 0) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return null;
}
