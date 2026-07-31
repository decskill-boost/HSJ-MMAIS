import { useId } from "react";
import { useDialogo } from "../../hooks/useDialogo";
import BtnGlobal from "../BtnGlobal";

interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmação. Antes era só uma `<div>` por cima do ecrã: o foco
 * ficava atrás na página, o Escape não fechava e os leitores de ecrã nem
 * sabiam que havia um diálogo aberto.
 *
 * O «Cancelar» vem primeiro na ordem do DOM para receber o foco inicial — a
 * ação destrutiva nunca fica debaixo do dedo.
 */
const ConfirmDialog = ({
  title = "Confirmação",
  message,
  confirmLabel = "Apagar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) => {
  const caixa = useDialogo(onCancel);
  const idTitulo = useId();
  const idMensagem = useId();

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
        className="painel painel-alto entrada-pop w-full max-w-md p-6"
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
