import { useEffect } from "react";

const BASE = "MMAIS — Mais Minutos Ativos";

/**
 * Numa SPA o título do separador não muda sozinho: sem isto, o histórico do
 * browser e os leitores de ecrã anunciavam sempre a mesma página.
 */
export const useTituloPagina = (titulo?: string) => {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${BASE}` : BASE;
  }, [titulo]);
};
