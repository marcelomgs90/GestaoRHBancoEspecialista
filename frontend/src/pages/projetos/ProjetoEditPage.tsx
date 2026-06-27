import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  FileText,
  LockKeyhole,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { projetoService } from '@/services/projetoService';
import { formatCurrency, formatDate } from '@/types/projeto';
import type { Projeto } from '@/types/projeto';
import {
  FONTE_LABELS,
  STATUS_PROJETO_LABELS,
  StatusProjeto,
  TipoDocumentoProjeto,
  TIPO_DOCUMENTO_PROJETO_LABELS,
} from '@/types/enums';
import type { ProjetoAnexo } from '@/types/projeto';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

const schema = z
  .object({
    codigo: z.preprocess(
      (value) => (value === '' || value === undefined || value === null ? undefined : value),
      z.string().trim().optional(),
    ),
    sigla: z
      .string()
      .trim()
      .min(5, 'Sigla deve ter no mínimo 5 caracteres')
      .max(20, 'Sigla deve ter no máximo 20 caracteres')
      .regex(/^[A-Za-z0-9]+$/, 'Sigla deve conter apenas letras e números'),
    titulo: z.string().trim().min(3, 'Título deve ter pelo menos 3 caracteres'),
    descricao: z.string().optional(),
    data_inicio: z.string().min(1, 'Informe a data de início'),
    data_fim: z.string().min(1, 'Informe a data de encerramento'),
    status: z.nativeEnum(StatusProjeto),
  })
  .refine((d) => !d.data_inicio || !d.data_fim || d.data_fim >= d.data_inicio, {
    message: 'Data de encerramento deve ser posterior ao início',
    path: ['data_fim'],
  });

type FormData = z.infer<typeof schema>;
type AnexosPendentes = Partial<Record<TipoDocumentoProjeto, File>>;

const statusOptions = [
  StatusProjeto.ATIVO,
  StatusProjeto.FINALIZADO,
  StatusProjeto.SUSPENSO,
];

const documentoSlots = [
  TipoDocumentoProjeto.ACORDO_PARCEIRA,
  TipoDocumentoProjeto.PLANO_TRABALHO,
  TipoDocumentoProjeto.DIARIO_OFICIAL,
];
const extensoesPermitidas = ['.pdf', '.doc', '.docx'];

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ProjetoEditPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();
  const projetoId = Number(id_projeto);

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [anexos, setAnexos] = useState<ProjetoAnexo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [anexoError, setAnexoError] = useState<string | null>(null);
  const [anexosPendentes, setAnexosPendentes] = useState<AnexosPendentes>({});
  const [anexosComplementaresPendentes, setAnexosComplementaresPendentes] = useState<File[]>([]);
  const [anexosRemovidos, setAnexosRemovidos] = useState<number[]>([]);
  const [confirmacaoSalvar, setConfirmacaoSalvar] = useState<FormData | null>(null);
  const [salvando, setSalvando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: '',
      sigla: '',
      titulo: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      status: StatusProjeto.ATIVO,
    },
  });

  useEffect(() => {
    if (!projetoId) return;

    async function load() {
      try {
        const [data, anexosData] = await Promise.all([
          projetoService.obter(projetoId),
          projetoService.listarAnexos(projetoId),
        ]);
        setProjeto(data);
        setAnexos(anexosData);
        reset({
          codigo: data.codigo ?? '',
          sigla: data.sigla,
          titulo: data.titulo,
          descricao: data.descricao ?? '',
          data_inicio: data.data_inicio.split('T')[0],
          data_fim: data.data_fim.split('T')[0],
          status: data.status,
        });
      } catch {
        setErro('Não foi possível carregar os dados do projeto.');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [projetoId, reset]);

  const totalFontes = useMemo(() => {
    if (!projeto) return 0;
    return projeto.fontes_financiamento.reduce(
      (total, fonte) => total + Number(fonte.valor || 0),
      0,
    );
  }, [projeto]);

  const totalAnexosVisiveis = useMemo(
    () =>
      documentoSlots.filter((tipo) => {
        const anexo = anexos.find((item) => item.tipo_documento === tipo);
        return Boolean(anexosPendentes[tipo] || (anexo && !anexosRemovidos.includes(anexo.id)));
      }).length,
    [anexos, anexosPendentes, anexosRemovidos],
  );

  const onSubmit = (data: FormData) => {
    setSubmitError(null);
    setConfirmacaoSalvar(data);
  };

  const confirmarSalvar = async () => {
    const data = confirmacaoSalvar;
    if (!projetoId || !data) return;
    setSubmitError(null);
    setSalvando(true);

    try {
      const atualizado = await projetoService.atualizar(projetoId, {
        codigo: data.codigo?.trim() || undefined,
        sigla: data.sigla,
        titulo: data.titulo,
        descricao: data.descricao?.trim() || undefined,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        status: data.status,
      });

      for (const anexoId of anexosRemovidos) {
        await projetoService.removerAnexo(projetoId, anexoId);
      }

      for (const [tipo, arquivo] of Object.entries(anexosPendentes)) {
        if (arquivo) {
          await projetoService.enviarAnexo(projetoId, tipo as TipoDocumentoProjeto, arquivo);
        }
      }

      for (const arquivo of anexosComplementaresPendentes) {
        await projetoService.enviarAnexo(
          projetoId,
          TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR,
          arquivo,
        );
      }

      const anexosAtualizados = await projetoService.listarAnexos(projetoId);
      setProjeto(atualizado);
      setAnexos(anexosAtualizados);
      setAnexosPendentes({});
      setAnexosComplementaresPendentes([]);
      setAnexosRemovidos([]);
      reset({
        codigo: atualizado.codigo ?? '',
        sigla: atualizado.sigla,
        titulo: atualizado.titulo,
        descricao: atualizado.descricao ?? '',
        data_inicio: atualizado.data_inicio.split('T')[0],
        data_fim: atualizado.data_fim.split('T')[0],
        status: atualizado.status,
      });
      setConfirmacaoSalvar(null);
      navigate(`/projetos/${atualizado.id}`);
    } catch (err) {
      setConfirmacaoSalvar(null);
      setSubmitError(getApiErrorMessage(err, 'Erro ao atualizar projeto. Tente novamente.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  };

  const getAnexoPorTipo = (tipo: TipoDocumentoProjeto) =>
    anexos.find((anexo) => anexo.tipo_documento === tipo);

  const validarArquivo = (file: File) => {
    const extensao = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!extensoesPermitidas.includes(extensao)) {
      setAnexoError('Formato de arquivo nao permitido. Use apenas PDF, DOC ou DOCX.');
      return false;
    }
    return true;
  };

  const handleUploadAnexo = (tipo: TipoDocumentoProjeto, file?: File) => {
    if (!file) return;
    setAnexoError(null);
    if (!validarArquivo(file)) return;

    const anexoAtual = getAnexoPorTipo(tipo);
    setAnexosPendentes((atuais) => ({ ...atuais, [tipo]: file }));
    if (anexoAtual) {
      setAnexosRemovidos((atuais) => atuais.filter((id) => id !== anexoAtual.id));
    }
  };

  const handleUploadAnexosComplementares = (files: FileList | null) => {
    if (!files?.length) return;
    setAnexoError(null);

    const arquivos = Array.from(files);
    const todosValidos = arquivos.every((file) => validarArquivo(file));
    if (!todosValidos) return;

    setAnexosComplementaresPendentes((atuais) => [...atuais, ...arquivos]);
  };

  const handleBaixarAnexo = async (anexo: ProjetoAnexo) => {
    if (!projetoId) return;
    setAnexoError(null);
    try {
      const blob = await projetoService.baixarAnexo(projetoId, anexo.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.nome_arquivo_original;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setAnexoError('Erro ao baixar documento. Tente novamente.');
    }
  };

  const handleRemoverAnexo = (tipo: TipoDocumentoProjeto, anexo?: ProjetoAnexo) => {
    setAnexoError(null);

    setAnexosPendentes((atuais) => {
      const atualizados = { ...atuais };
      delete atualizados[tipo];
      return atualizados;
    });

    if (anexo) {
      setAnexosRemovidos((atuais) =>
        atuais.includes(anexo.id) ? atuais : [...atuais, anexo.id],
      );
    }
  };

  const anexosComplementares = anexos.filter(
    (anexo) =>
      anexo.tipo_documento === TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR
      && !anexosRemovidos.includes(anexo.id),
  );
  const anexosComplementaresRemovidos = anexos.filter(
    (anexo) =>
      anexo.tipo_documento === TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR
      && anexosRemovidos.includes(anexo.id),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Carregando projeto...</p>
      </div>
    );
  }

  if (erro || !projeto) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <p className="text-sm text-red-600">{erro ?? 'Projeto não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <button
            onClick={() => navigate(`/projetos/${projeto.id}`)}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-950 cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar ao projeto
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Editar projeto
            </h2>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Vigência atual
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-slate-900">
            <Calendar size={13} className="text-slate-400" />
            {formatDate(projeto.data_inicio)} até {formatDate(projeto.data_fim)}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Dados cadastrais
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Ajuste apenas as informações editáveis do projeto.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                Título
              </label>
              <input
                type="text"
                {...register('titulo')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              {errors.titulo && <p className="text-xs text-red-600">{errors.titulo.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Código do Projeto
                </label>
                <input
                  type="text"
                  {...register('codigo')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Opcional"
                />
                {errors.codigo && (
                  <p className="text-xs text-red-600">{errors.codigo.message}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Sigla do Projeto
                </label>
                <input
                  type="text"
                  maxLength={20}
                  {...register('sigla')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                {errors.sigla && (
                  <p className="text-xs text-red-600">{errors.sigla.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                Descrição
              </label>
              <textarea
                rows={5}
                {...register('descricao')}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Início
                </label>
                <input
                  type="date"
                  {...register('data_inicio')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                {errors.data_inicio && (
                  <p className="text-xs text-red-600">{errors.data_inicio.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Encerramento
                </label>
                <input
                  type="date"
                  {...register('data_fim')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                {errors.data_fim && (
                  <p className="text-xs text-red-600">{errors.data_fim.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_PROJETO_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Documentos do projeto
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Anexe um arquivo para cada tipo de documento obrigatório.
                </p>
              </div>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                {totalAnexosVisiveis}/3 anexos
              </span>
            </div>

            {anexoError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{anexoError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {documentoSlots.map((tipo) => {
                const anexo = getAnexoPorTipo(tipo) as ProjetoAnexo;
                const arquivoPendente = anexosPendentes[tipo];
                const remocaoPendente = anexo ? anexosRemovidos.includes(anexo.id) : false;
                const anexoVisivel = remocaoPendente ? undefined : anexo;
                const nomeArquivo = arquivoPendente?.name ?? anexoVisivel?.nome_arquivo_original;
                return (
                  <div
                    key={tipo}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-900">
                            {TIPO_DOCUMENTO_PROJETO_LABELS[tipo]}
                          </p>
                          {nomeArquivo ? (
                            <>
                              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                                {nomeArquivo}
                              </p>
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {arquivoPendente ? `${formatFileSize(arquivoPendente.size)} - Pendente` : (
                                  <>
                                {formatFileSize(anexo.tamanho_bytes)} · {formatDate(anexo.data_upload)}
                                  </>
                                )}
                              </p>
                            </>
                          ) : remocaoPendente ? (
                            <p className="mt-1 text-xs font-bold text-red-500">
                              Remoção pendente
                            </p>
                          ) : (
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              Nenhum arquivo anexado
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {anexoVisivel && !arquivoPendente && (
                          <button
                            type="button"
                            onClick={() => void handleBaixarAnexo(anexoVisivel)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 cursor-pointer"
                          >
                            <Download size={13} />
                            Baixar
                          </button>
                        )}

                        {(anexoVisivel || arquivoPendente) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoverAnexo(tipo, arquivoPendente ? undefined : anexoVisivel)
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            {arquivoPendente && anexoVisivel ? 'Cancelar troca' : 'Remover'}
                          </button>
                        )}

                        {remocaoPendente && anexo && (
                          <button
                            type="button"
                            onClick={() =>
                              setAnexosRemovidos((atuais) =>
                                atuais.filter((id) => id !== anexo.id),
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 cursor-pointer"
                          >
                            Desfazer
                          </button>
                        )}

                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800">
                          <Upload size={13} />
                          {arquivoPendente || anexoVisivel ? 'Substituir' : 'Anexar'}
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            disabled={salvando}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              handleUploadAnexo(tipo, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Documentos complementares
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Anexe arquivos adicionais relacionados ao projeto.
                </p>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800">
                <Upload size={13} />
                Anexar arquivos
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx"
                  disabled={salvando}
                  onChange={(event) => {
                    handleUploadAnexosComplementares(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>

            {anexosComplementares.length === 0
              && anexosComplementaresRemovidos.length === 0
              && anexosComplementaresPendentes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nenhum documento complementar anexado
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {anexosComplementares.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {anexo.nome_arquivo_original}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {formatFileSize(anexo.tamanho_bytes)} · {formatDate(anexo.data_upload)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleBaixarAnexo(anexo)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-100 cursor-pointer"
                        >
                          <Download size={13} />
                          Baixar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAnexosRemovidos((atuais) =>
                              atuais.includes(anexo.id) ? atuais : [...atuais, anexo.id],
                            )
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {anexosComplementaresRemovidos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="rounded-lg border border-red-100 bg-red-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-red-800">
                          {anexo.nome_arquivo_original}
                        </p>
                        <p className="mt-1 text-xs font-bold text-red-500">
                          Remoção pendente
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAnexosRemovidos((atuais) =>
                            atuais.filter((id) => id !== anexo.id),
                          )
                        }
                        className="rounded-lg border border-red-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 transition-all hover:bg-red-50 cursor-pointer"
                      >
                        Desfazer
                      </button>
                    </div>
                  </div>
                ))}

                {anexosComplementaresPendentes.map((arquivo, index) => (
                  <div
                    key={`${arquivo.name}-${arquivo.size}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {arquivo.name}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {formatFileSize(arquivo.size)} - Pendente
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAnexosComplementaresPendentes((atuais) =>
                            atuais.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                <LockKeyhole size={17} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Campos bloqueados
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Coordenador e fontes não são alterados nesta tela.
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Usuário
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {projeto.usuario_nome ?? projeto.coordenador_nome ?? `Usuário #${projeto.coordenador_id}`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                Fontes
              </h3>
              <span className="text-xs font-black text-slate-900">
                {formatCurrency(totalFontes)}
              </span>
            </div>
            <div className="space-y-2">
              {projeto.fontes_financiamento.map((fonte) => (
                <div
                  key={fonte.fonte}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {FONTE_LABELS[fonte.fonte]}
                  </span>
                  <strong className="text-xs text-slate-950">
                    {formatCurrency(fonte.valor)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/projetos/${projeto.id}`)}
              className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-950 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || salvando}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </aside>
      </form>

      {confirmacaoSalvar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => {
              if (!salvando) setConfirmacaoSalvar(null);
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                <Save size={20} />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-base font-bold text-slate-900">Salvar alterações?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Confirme para gravar as alterações do projeto {projeto.sigla}.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={salvando}
                onClick={() => setConfirmacaoSalvar(null)}
                className="rounded-lg border border-slate-200 bg-white py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void confirmarSalvar()}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
      {sucesso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setSucesso(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-base font-bold text-slate-900">Projeto atualizado</h3>
                <p className="mt-1 text-xs text-slate-500">
                  As alterações foram salvas para o projeto {projeto.sigla}.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSucesso(false)}
                className="rounded-lg border border-slate-200 bg-white py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => navigate(`/projetos/${projeto.id}`)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 cursor-pointer"
              >
                Confirmar
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );
}
