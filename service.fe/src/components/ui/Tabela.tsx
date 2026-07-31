import { useId } from "react";

type Direcao = "asc" | "desc";

interface TabelaProps {
  /** O que a tabela lista, para quem não a vê. Vai para o `<caption>`. */
  legenda: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Moldura das tabelas da plataforma.
 *
 * A região de scroll é alcançável por teclado (`tabIndex`): sem isso, uma
 * tabela que transborda na horizontal só se conseguia percorrer com rato.
 */
export const Tabela = ({ legenda, children, className = "" }: TabelaProps) => {
  const idLegenda = useId();

  return (
    <div className={className}>
      <div
        role="region"
        aria-labelledby={idLegenda}
        tabIndex={0}
        className="painel overflow-x-auto"
      >
        <table className="min-w-full text-left text-sm">
          <caption id={idLegenda} className="sr-only">
            {legenda}
          </caption>
          {children}
        </table>
      </div>

      {/* No telemóvel a tabela transborda: sem aviso, ninguém descobre as
          colunas que ficam de fora. */}
      <p className="mt-2 text-center text-xs font-bold text-aco sm:hidden">
        Desliza a tabela para o lado para ver tudo →
      </p>
    </div>
  );
};

/** Cabeçalho do corpo da tabela — fundo papel para separar do conteúdo. */
export const CabecaTabela = ({ children }: { children: React.ReactNode }) => (
  <thead className="border-b-[3px] border-tinta bg-papel">{children}</thead>
);

export const CorpoTabela = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y-2 divide-tinta/10">{children}</tbody>
);

interface ThProps {
  children: React.ReactNode;
  className?: string;
}

/** `scope="col"` liga cada célula ao seu cabeçalho nos leitores de ecrã. */
export const Th = ({ children, className = "" }: ThProps) => (
  <th
    scope="col"
    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-aco ${className}`}
  >
    {children}
  </th>
);

interface ThOrdenavelProps extends ThProps {
  ativa: boolean;
  direcao: Direcao;
  onOrdenar: () => void;
}

/**
 * Cabeçalho que ordena. Antes era um `<th onClick>`: impossível de usar com
 * teclado e sem forma de anunciar por que coluna a tabela está ordenada.
 */
export const ThOrdenavel = ({
  children,
  ativa,
  direcao,
  onOrdenar,
  className = "",
}: ThOrdenavelProps) => (
  <th
    scope="col"
    aria-sort={ativa ? (direcao === "asc" ? "ascending" : "descending") : "none"}
    className={`px-4 py-1 ${className}`}
  >
    <button
      type="button"
      onClick={onOrdenar}
      className="flex min-h-11 w-full items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-aco transition-colors hover:text-tinta"
    >
      {children}
      <span
        aria-hidden="true"
        className={ativa ? "text-cobalto" : "text-tinta/30"}
      >
        {ativa ? (direcao === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  </th>
);

/** Linha que ocupa a tabela toda — para carregar, erro ou lista vazia. */
export const LinhaMensagem = ({
  colunas,
  children,
}: {
  colunas: number;
  children: React.ReactNode;
}) => (
  <tr>
    <td colSpan={colunas} className="px-4 py-8 text-center">
      {children}
    </td>
  </tr>
);
