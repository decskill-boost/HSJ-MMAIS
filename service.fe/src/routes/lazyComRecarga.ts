import { lazy, type ComponentType } from "react";

const CHAVE = "hsjmaais.recarga-apos-deploy";

/** Se já recarregou há menos disto e o ficheiro continua a faltar, o problema é outro. */
const INTERVALO_MINIMO_MS = 10_000;

/**
 * Envolve o `import()` de um ecrã para sobreviver a um deploy.
 *
 * Os ecrãs são descarregados à parte, com nomes de ficheiro que mudam a cada
 * build. Um separador aberto antes de um deploy continua com o index.html
 * antigo e, ao abrir um ecrã que ainda não tinha carregado, pede um ficheiro
 * que já não existe na Vercel: "Failed to fetch dynamically imported module" e
 * o ecrã de erro do React Router. Recarregar traz o index.html novo, que aponta
 * para os ficheiros certos.
 *
 * Recarrega uma vez só. Se voltar a falhar logo a seguir (sem rede, ficheiro
 * mesmo em falta), o erro segue para o ecrã de erro em vez de entrar num ciclo
 * de recarregamentos.
 */
export function importarComRecarga<T>(
  importar: () => Promise<T>,
): () => Promise<T> {
  return () =>
    importar().catch((erro: unknown) => {
      if (!podeRecarregar()) throw erro;
      window.location.reload();
      // Enquanto a página recarrega, o Suspense fica no indicador de carga em
      // vez de mostrar o erro.
      return new Promise<never>(() => {});
    });
}

/** `lazy()` do React com o `importarComRecarga` à volta. */
export function lazyComRecarga<T extends ComponentType<object>>(
  importar: () => Promise<{ default: T }>,
) {
  return lazy(importarComRecarga(importar));
}

function podeRecarregar(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE) ?? 0);
    if (Date.now() - ultima < INTERVALO_MINIMO_MS) return false;
    sessionStorage.setItem(CHAVE, String(Date.now()));
    return true;
  } catch {
    // Sem sessionStorage não há como travar um ciclo: mais vale mostrar o erro.
    return false;
  }
}
