import CapitaoMais from "../CapitaoMais";

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  /** O que fazer a seguir. Um ecrã vazio é um convite, não um beco. */
  acao?: React.ReactNode;
}

const EstadoVazio = ({ titulo, descricao, acao }: EstadoVazioProps) => (
  <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
    <CapitaoMais className="h-16 w-auto" title="" />
    <p className="font-display text-xl tracking-wide text-tinta">{titulo}</p>
    {descricao && <p className="max-w-sm text-sm text-aco">{descricao}</p>}
    {acao && <div className="mt-1">{acao}</div>}
  </div>
);

export default EstadoVazio;
