import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page } from 'react-pdf';
import { FileText, X } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type PdfPreviewModalProps = {
  open: boolean;
  nomeArquivo: string;
  blob: Blob | null;
  onClose: () => void;
};

class PdfErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center text-xs font-medium text-slate-500">
          Não foi possível visualizar este PDF. Use o botão &ldquo;Baixar&rdquo; para
          abrir em outra ferramenta.
        </div>
      );
    }
    return this.props.children;
  }
}

export function PdfPreviewModal({
  open,
  nomeArquivo,
  blob,
  onClose,
}: PdfPreviewModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setDownloadUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  useEffect(() => {
    if (!open) {
      setNumPages(0);
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-[90vh] w-[min(1100px,95vw)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-600">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Visualização de documento
              </p>
              <div className="group relative inline-block max-w-full">
                <a
                  href={downloadUrl ?? '#'}
                  download={nomeArquivo}
                  className="block truncate text-sm font-bold text-blue-600 transition-colors hover:text-blue-700 cursor-pointer"
                >
                  {nomeArquivo}
                </a>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                >
                  Clique para baixar
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="relative flex-1 overflow-auto bg-slate-50 p-6">
          {blob ? (
            <PdfErrorBoundary onError={() => {}}>
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                    Carregando documento...
                  </div>
                }
              >
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
                  <Document
                    file={blob}
                    onLoadSuccess={(info) => setNumPages(info.numPages)}
                    loading={
                      <div className="flex h-64 w-full items-center justify-center text-xs font-medium text-slate-500">
                        Carregando documento...
                      </div>
                    }
                  >
                    {Array.from({ length: numPages || 1 }, (_, i) => (
                      <Page
                        key={`page-${i + 1}`}
                        pageNumber={i + 1}
                        width={760}
                        className="rounded border border-slate-200 bg-white shadow-sm"
                      />
                    ))}
                  </Document>
                </div>
              </Suspense>
            </PdfErrorBoundary>
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
              Carregando documento...
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
