interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title = "Confirmação",
  message,
  confirmLabel = "Apagar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/60">
      <div className="w-full max-w-md rounded-2xl bg-papel-claro p-6 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-tinta">{title}</h3>
          <p className="mt-2 text-sm text-aco">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-tinta/15 px-4 py-2 text-sm font-medium text-tinta hover:bg-papel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-capa-escura px-4 py-2 text-sm font-semibold text-papel hover:bg-capa-escura"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
