import { useEffect, useId, useRef } from "react";
import BtnGlobal from "../../../BtnGlobal";

interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCAVEIS =
  "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/**
 * Diálogo de confirmação. Antes era só uma `<div>` por cima do ecrã: o foco
 * ficava atrás na página, o Escape não fechava e os leitores de ecrã nem
 * sabiam que havia um diálogo aberto.
 */
const ConfirmDialog = ({
  title = "Confirmação",
  message,
  confirmLabel = "Apagar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) => {
  const caixa = useRef<HTMLDivElement>(null);
  const botaoCancelar = useRef<HTMLButtonElement>(null);
  const fechar = useRef(onCancel);
  const idTitulo = useId();
  const idMensagem = useId();

  useEffect(() => {
    fechar.current = onCancel;
  });

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    // Abre no «Cancelar»: a ação destrutiva nunca fica debaixo do dedo.
    botaoCancelar.current?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/70 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCancel();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensagem}
        className="painel painel-alto w-full max-w-md p-6"
      >
        <h2
          id={idTitulo}
          className="font-display text-2xl tracking-wide text-tinta"
        >
          {title}
        </h2>
        <p id={idMensagem} className="mt-2 text-sm text-tinta/80">
          {message}
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={botaoCancelar}
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro px-5 text-sm font-bold text-tinta shadow-vinheta transition-all duration-75 hover:bg-papel active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            {cancelLabel}
          </button>
          <BtnGlobal variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </BtnGlobal>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
