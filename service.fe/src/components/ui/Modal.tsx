import { useDialogo } from "../../hooks/useDialogo";

interface ModalProps {
  /** Nome do diálogo para quem não o vê. Não é desenhado — o conteúdo já traz o seu título. */
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  /** Largura máxima da caixa, ex.: "max-w-lg". */
  className?: string;
}

const Modal = ({ titulo, aoFechar, children, className = "max-w-lg" }: ModalProps) => {
  const caixa = useDialogo(aoFechar);

  return (
    <div
      // h-dvh: em móvel a barra do browser encolhe o ecrã e o `bottom-0` sozinho
      // deixaria o overlay por baixo dela; com altura dinâmica cobre o que se vê.
      className="fixed inset-0 z-50 flex h-dvh items-center justify-center bg-tinta/60 p-4 backdrop-blur-sm"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`painel painel-alto entrada-pop relative max-h-[90dvh] w-full overflow-y-auto ${className}`}
      >
        <button
          type="button"
          onClick={aoFechar}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-tinta bg-papel-claro text-tinta transition-colors hover:bg-raio/25"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ✕
          </span>
          <span className="sr-only">Fechar</span>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
