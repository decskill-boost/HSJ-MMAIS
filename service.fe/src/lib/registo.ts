/**
 * Registo de diagnóstico do arranque de sessão.
 *
 * O rasto do login é útil a desenvolver, mas em produção estas linhas iam
 * parar à consola do browser com emails e estado de sessão de crianças em
 * tratamento — dados de saúde de menores não têm nada que ficar à vista de
 * quem abra as ferramentas de programador. Em produção isto não faz nada.
 *
 * Erros e avisos continuam a usar `console.error`/`console.warn` diretamente:
 * esses queremos sempre ver.
 */
export const registarDebug = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};
