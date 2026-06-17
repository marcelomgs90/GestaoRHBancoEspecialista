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
  CheckCircle2,
  LockKeyhole,
  Save,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { projetoService } from '@/services/projetoService';
import { formatCurrency, formatDate } from '@/types/projeto';
import type { Projeto } from '@/types/projeto';
import {
  FONTE_LABELS,
  STATUS_PROJETO_LABELS,
  StatusProjeto,
} from '@/types/enums';

const schema = z
  .object({
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

const statusOptions = [
  StatusProjeto.ATIVO,
  StatusProjeto.FINALIZADO,
  StatusProjeto.SUSPENSO,
];

export default function ProjetoEditPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();
  const projetoId = Number(id_projeto);

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
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
        const data = await projetoService.obter(projetoId);
        setProjeto(data);
        reset({
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

  const onSubmit = async (data: FormData) => {
    if (!projetoId) return;
    setSubmitError(null);

    try {
      const atualizado = await projetoService.atualizar(projetoId, {
        titulo: data.titulo,
        descricao: data.descricao?.trim() || undefined,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        status: data.status,
      });
      setProjeto(atualizado);
      reset({
        titulo: atualizado.titulo,
        descricao: atualizado.descricao ?? '',
        data_inicio: atualizado.data_inicio.split('T')[0],
        data_fim: atualizado.data_fim.split('T')[0],
        status: atualizado.status,
      });
      setSucesso(true);
    } catch (err) {
      const ax = err as AxiosError<{ detail: string }>;
      setSubmitError(ax.response?.data?.detail ?? 'Erro ao atualizar projeto. Tente novamente.');
    }
  };

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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {projeto.codigo}
            </p>
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
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
              ID {projeto.id}
            </span>
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
                  Código, coordenador e fontes não são alterados nesta tela.
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Código
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">{projeto.codigo}</p>
              </div>

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
              disabled={isSubmitting || !isDirty}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </aside>
      </form>

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
                  As alterações foram salvas para o projeto {projeto.codigo}.
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
    </div>
  );
}
