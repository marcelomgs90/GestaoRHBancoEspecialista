import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import type { Anexo } from '../../types/anexo';

type AnexoItemProps = {
  anexo: Anexo;
  onVisualizar: (anexo: Anexo) => void;
  onBaixar: (anexo: Anexo) => void;
  onRemover?: (anexo: Anexo) => void;
};

export function AnexoItem({
  anexo,
  onVisualizar,
  onBaixar,
  onRemover,
}: AnexoItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-500">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-900">
            {anexo.nome_arquivo}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Documento PDF
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onVisualizar(anexo)}
          className="rounded p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 cursor-pointer"
          aria-label="Visualizar"
          title="Visualizar"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={() => onBaixar(anexo)}
          className="rounded p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 cursor-pointer"
          aria-label="Baixar"
          title="Baixar"
        >
          <Download size={14} />
        </button>
        {onRemover && anexo.origem === 'USUARIO' && (
          <button
            type="button"
            onClick={() => onRemover(anexo)}
            className="rounded p-2 text-slate-500 transition-colors hover:bg-white hover:text-red-600 cursor-pointer"
            aria-label="Remover"
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
