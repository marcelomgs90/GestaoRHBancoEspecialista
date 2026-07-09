import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Paperclip, Plus, Upload } from 'lucide-react';

import { anexoService } from '../../services/anexoService';
import { getApiErrorMessage } from '../../lib/getApiErrorMessage';
import { usePerfil } from '../../hooks/usePerfil';
import type { Anexo } from '../../types/anexo';

import { AnexoItem } from './AnexoItem';
import { PdfPreviewModal } from './PdfPreviewModal';
import { ConfirmModal } from '../ConfirmModal';

type AnexosSectionProps = {
  projetoId: number;
};

const LIMITE_ENVIO = 4;

export function AnexosSection({ projetoId }: AnexosSectionProps) {
  const { podeEditarProjeto } = usePerfil();
  const [gerados, setGerados] = useState<Anexo[]>([]);
  const [enviados, setEnviados] = useState<Anexo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [previewAberto, setPreviewAberto] = useState<Anexo | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    try {
      const [sistema, usuario] = await Promise.all([
        anexoService.listar(projetoId, { origem: 'SISTEMA', per_page: 100 }),
        anexoService.listar(projetoId, { origem: 'USUARIO', per_page: 100 }),
      ]);
      setGerados(sistema.items);
      setEnviados(usuario.items);
      setErro(null);
    } catch (e) {
      setErro(getApiErrorMessage(e, 'Não foi possível carregar os anexos.'));
    }
  }, [projetoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totalEnviados = enviados.length;
  const limiteAtinguido = totalEnviados >= LIMITE_ENVIO;

  const abrirPreview = useCallback(
    async (anexo: Anexo) => {
      setPreviewAberto(anexo);
      setPreviewBlob(null);
      try {
        const blob = await anexoService.preview(projetoId, anexo.id);
        setPreviewBlob(blob);
      } catch {
        setPreviewBlob(null);
      }
    },
    [projetoId],
  );

  const fecharPreview = useCallback(() => {
    setPreviewAberto(null);
    setPreviewBlob(null);
  }, []);

  const baixarAnexo = useCallback(
    async (anexo: Anexo) => {
      try {
        const blob = await anexoService.download(projetoId, anexo.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = anexo.nome_arquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        setErro(getApiErrorMessage(e, 'Falha ao baixar o anexo.'));
      }
    },
    [projetoId],
  );

  const [anexoParaRemover, setAnexoParaRemover] = useState<Anexo | null>(null);
  const [removendo, setRemovendo] = useState(false);

  const pedirRemocao = useCallback((anexo: Anexo) => {
    setAnexoParaRemover(anexo);
  }, []);

  const cancelarRemocao = useCallback(() => {
    if (removendo) return;
    setAnexoParaRemover(null);
  }, [removendo]);

  const confirmarRemocao = useCallback(async () => {
    if (!anexoParaRemover) return;
    setRemovendo(true);
    try {
      await anexoService.remover(projetoId, anexoParaRemover.id);
      setAnexoParaRemover(null);
      await carregar();
    } catch (e) {
      setErro(getApiErrorMessage(e, 'Falha ao remover o anexo.'));
    } finally {
      setRemovendo(false);
    }
  }, [anexoParaRemover, carregar, projetoId]);

  const handleArquivo = useCallback(
    async (arquivo: File | null) => {
      if (!arquivo) return;
      setEnviando(true);
      setErro(null);
      try {
        await anexoService.upload(projetoId, arquivo);
        await carregar();
      } catch (e) {
        setErro(getApiErrorMessage(e, 'Falha ao enviar o anexo.'));
      } finally {
        setEnviando(false);
      }
    },
    [carregar, projetoId],
  );

  const contador = useMemo(
    () => `${totalEnviados}/${LIMITE_ENVIO}`,
    [totalEnviados],
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={14} className="text-slate-600 dark:text-slate-300" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 dark:text-slate-100">
            Anexos
          </h4>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          {contador}
        </span>
      </div>

      {erro && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {erro}
        </div>
      )}

      {gerados.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Gerados
          </p>
          <div className="space-y-2">
            {gerados.map((anexo) => (
              <AnexoItem
                key={anexo.id}
                anexo={anexo}
                onVisualizar={abrirPreview}
                onBaixar={baixarAnexo}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Enviados ({contador})
        </p>
        {enviados.length === 0 ? (
          <p className="rounded border border-dashed border-slate-200 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:border-slate-700">
            Nenhum documento enviado
          </p>
        ) : (
          <div className="space-y-2">
            {enviados.map((anexo) => (
              <AnexoItem
                key={anexo.id}
                anexo={anexo}
                onVisualizar={abrirPreview}
                onBaixar={baixarAnexo}
                onRemover={podeEditarProjeto ? pedirRemocao : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {podeEditarProjeto && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0] ?? null;
              void handleArquivo(arquivo);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={limiteAtinguido || enviando}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-white px-4 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 transition-colors hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer dark:border-slate-600 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:bg-blue-950"
          >
            {enviando ? (
              <>
                <Upload size={16} className="animate-pulse" />
                Enviando...
              </>
            ) : limiteAtinguido ? (
              <>
                <FileText size={16} />
                Limite de envios atingido
              </>
            ) : (
              <>
                <Plus size={16} />
                Upload de documentação
              </>
            )}
          </button>
        </div>
      )}

      <PdfPreviewModal
        open={previewAberto !== null}
        nomeArquivo={previewAberto?.nome_arquivo ?? ''}
        blob={previewBlob}
        onClose={fecharPreview}
      />

      <ConfirmModal
        open={anexoParaRemover !== null}
        title="Remover anexo?"
        message="Deseja mesmo remover este PDF? Esta ação não pode ser desfeita."
        nomeArquivo={anexoParaRemover?.nome_arquivo}
        confirmLabel={removendo ? 'Removendo...' : 'Remover'}
        onConfirm={confirmarRemocao}
        onCancel={cancelarRemocao}
      />
    </div>
  );
}
