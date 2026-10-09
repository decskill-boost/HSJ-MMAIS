import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importarComRecarga } from "../src/routes/lazyComRecarga";

const ERRO_DE_DEPLOY = new TypeError(
  "Failed to fetch dynamically imported module: https://hsj-mmais.vercel.app/assets/DashboardCorpoClinico-NqwU_NoU.js",
);

/** Dá tempo a uma promessa para resolver, se é que vai resolver. */
const estado = (promessa: Promise<unknown>) =>
  Promise.race([
    promessa.then(
      () => "resolvida",
      () => "rejeitada",
    ),
    new Promise((r) => setTimeout(() => r("pendente"), 10)),
  ]);

describe("importarComRecarga", () => {
  const reload = vi.fn();
  const locationOriginal = window.location;

  beforeEach(() => {
    reload.mockClear();
    window.sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...locationOriginal, reload },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: locationOriginal,
    });
  });

  it("devolve o ecrã quando o ficheiro existe, sem recarregar", async () => {
    const modulo = { default: () => null };

    await expect(importarComRecarga(() => Promise.resolve(modulo))()).resolves.toBe(modulo);
    expect(reload).not.toHaveBeenCalled();
  });

  /**
   * O caso do erro: separador aberto antes do deploy pede um ficheiro que já
   * não existe. Recarrega, e o ecrã de erro nunca chega a aparecer.
   */
  it("recarrega a página quando o ficheiro do ecrã já não existe", async () => {
    const carregar = importarComRecarga(() => Promise.reject(ERRO_DE_DEPLOY));

    await expect(estado(carregar())).resolves.toBe("pendente");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("não entra em ciclo: se falhar logo depois de recarregar, mostra o erro", async () => {
    const carregar = importarComRecarga(() => Promise.reject(ERRO_DE_DEPLOY));

    await estado(carregar()); // primeira falha: recarrega
    await expect(carregar()).rejects.toBe(ERRO_DE_DEPLOY);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("volta a recarregar num deploy seguinte", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const carregar = importarComRecarga(() => Promise.reject(ERRO_DE_DEPLOY));

    await estado(carregar());
    vi.setSystemTime(Date.now() + 60_000);
    await estado(carregar());

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
