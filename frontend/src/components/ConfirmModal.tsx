import { AlertTriangle, X } from 'lucide-react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  nomeArquivo?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  nomeArquivo,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              {message}
            </p>
            {nomeArquivo && (
              <p className="mt-2 truncate rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {nomeArquivo}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-red-700 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
