import { AlertCircle, X } from 'lucide-react';

type FeedbackModalProps = {
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
};

export function FeedbackModal({
  title,
  message,
  onClose,
  actionLabel = 'Fechar',
}: FeedbackModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
