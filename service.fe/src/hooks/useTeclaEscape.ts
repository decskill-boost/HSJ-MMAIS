import { useEffect, useRef } from "react";

/**
 * Fecha com Escape. Para os ecrãs que se abrem por cima de tudo (o leitor de
 * exercícios, a gaveta do menu) mas que não são caixas de diálogo — aí o
 * `useDialogo` é que trata do foco.
 */
export const useTeclaEscape = (aoFechar: () => void, ativo = true) => {
  const fechar = useRef(aoFechar);

  useEffect(() => {
    fechar.current = aoFechar;
  });

  useEffect(() => {
    if (!ativo) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar.current();
    };

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [ativo]);
};
