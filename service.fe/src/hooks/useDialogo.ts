import { useEffect, useRef } from "react";

const FOCAVEIS =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/**
 * Comportamento de diálogo, partilhado por todas as caixas que se abrem por
 * cima do ecrã: prende o foco lá dentro, fecha com Escape, trava o scroll da
 * página por trás e devolve o foco a quem o tinha antes.
 *
 * Sem isto, o foco ficava na página de trás — quem navega por teclado abria
 * uma caixa e continuava a tabular pelo ecrã que já não estava a ver.
 */
export const useDialogo = (aoFechar: () => void) => {
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef(aoFechar);

  useEffect(() => {
    fechar.current = aoFechar;
  });

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    caixa.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fechar.current();
        return;
      }
      if (evento.key !== "Tab") return;

      const focaveis = caixa.current?.querySelectorAll<HTMLElement>(FOCAVEIS);
      if (!focaveis?.length) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      anterior?.focus();
    };
  }, []);

  return caixa;
};
