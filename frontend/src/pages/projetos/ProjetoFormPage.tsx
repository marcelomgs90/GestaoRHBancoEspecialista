import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  Loader2,
  User,
} from 'lucide-react';
import { useEffect } from 'react';
import { projetoService } from '@/services/projetoService';
import { especialistaService } from '@/services/especialistaService';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfil } from '@/hooks/usePerfil';
import { FonteFinanciamento } from '@/types/enums';
import type { Pesquisador } from '@/types/projeto';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

const optionalCurrency = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : Number(value)),
  z.number().positive('Informe um valor maior que zero').optional(),
);

const requiredCurrency = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value === undefined || value === null ? 0 : Number(value)),
    z.number().positive(message),
  );

const baseSchema = z
  .object({
    codigo: z.string().trim().optional(),
    titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
    descricao: z.string().optional(),
    valor_empresa: requiredCurrency('Informe o valor da fonte Empresa'),
    fonte_embrapii: z.boolean().default(false),
    valor_embrapii: optionalCurrency,
    fonte_sebrae: z.boolean().default(false),
    valor_sebrae: optionalCurrency,
    data_inicio: z.string().min(1, 'Informe a data de início'),
    data_fim: z.string().min(1, 'Informe a data de encerramento'),
    coordenador_ref_pesquisador: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.fonte_embrapii && !d.valor_embrapii) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor_embrapii'],
        message: 'Informe o valor da fonte EMBRAPII',
      });
    }
    if (d.fonte_sebrae && !d.valor_sebrae) {
      ctx.addIssue({
        code: 'custom',
        path: ['valor_sebrae'],
        message: 'Informe o valor da fonte SEBRAE',
      });
    }
  })
  .refine((d) => !d.data_inicio || !d.data_fim || d.data_fim >= d.data_inicio, {
    message: 'Data de encerramento deve ser posterior ao início',
    path: ['data_fim'],
  });

type FormData = z.infer<typeof baseSchema>;

const parseCurrencyBRL = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits) / 100;
};

const formatCurrencyBRL = (value: unknown) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return '';
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

const PESQUISADOR_DEBOUNCE_MS = 300;

export default function ProjetoFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCoordenador } = usePerfil();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [codigoCriado, setCodigoCriado] = useState('');
  const [projetoCriadoId, setProjetoCriadoId] = useState<number | null>(null);

  const [pesquisadorTermo, setPesquisadorTermo] = useState('');
  const [pesquisadores, setPesquisadores] = useState<Pesquisador[]>([]);
  const [pesquisadorSelecionado, setPesquisadorSelecionado] = useState<Pesquisador | null>(null);
  const [buscandoPesquisadores, setBuscandoPesquisadores] = useState(false);
  const [pesquisadorErro, setPesquisadorErro] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      fonte_embrapii: false,
      fonte_sebrae: false,
      coordenador_ref_pesquisador: '',
    },
  });

  const fonteEmbrapii = watch('fonte_embrapii');
  const fonteSebrae = watch('fonte_sebrae');
  const valorEmpresa = watch('valor_empresa');
  const valorEmbrapii = watch('valor_embrapii');
  const valorSebrae = watch('valor_sebrae');

  const totalFontes = useMemo(() => {
    const valores = [
      Number(valorEmpresa) || 0,
      fonteEmbrapii ? Number(valorEmbrapii) || 0 : 0,
      fonteSebrae ? Number(valorSebrae) || 0 : 0,
    ];
    return valores.reduce((total, valor) => total + valor, 0);
  }, [fonteEmbrapii, fonteSebrae, valorEmpresa, valorEmbrapii, valorSebrae]);

  // Tipoahead de pesquisadores-servidor (somente para ADMIN/GESTOR_POLO).
  useEffect(() => {
    if (isCoordenador) return;

    const timer = window.setTimeout(async () => {
      setBuscandoPesquisadores(true);
      setPesquisadorErro(null);
      try {
        const resultado = await especialistaService.listarPesquisadores({
          tipo: 'Servidor',
          q: pesquisadorTermo || undefined,
          per_page: 50,
        });
        setPesquisadores(resultado.items);
      } catch (err) {
        setPesquisadorErro(
          getApiErrorMessage(err, 'Falha ao listar pesquisadores do Banco Especialista.'),
        );
        setPesquisadores([]);
      } finally {
        setBuscandoPesquisadores(false);
      }
    }, PESQUISADOR_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [isCoordenador, pesquisadorTermo]);

  const selecionarPesquisador = (p: Pesquisador) => {
    setPesquisadorSelecionado(p);
    setValue('coordenador_ref_pesquisador', p.matricula, { shouldValidate: true });
    setPesquisadorTermo('');
    setPesquisadores([]);
  };

  const limparPesquisadorSelecionado = () => {
    setPesquisadorSelecionado(null);
    setValue('coordenador_ref_pesquisador', '', { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      const fontes_financiamento = [
        { fonte: FonteFinanciamento.EMPRESA, valor: data.valor_empresa },
        ...(data.fonte_embrapii && data.valor_embrapii
          ? [{ fonte: FonteFinanciamento.EMBRAPII, valor: data.valor_embrapii }]
          : []),
        ...(data.fonte_sebrae && data.valor_sebrae
          ? [{ fonte: FonteFinanciamento.SEBRAE, valor: data.valor_sebrae }]
          : []),
      ];

      const payload: Record<string, unknown> = {
        ...(data.codigo ? { codigo: data.codigo } : {}),
        titulo: data.titulo,
        descricao: data.descricao,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        fontes_financiamento,
      };

      if (!isCoordenador) {
        if (!data.coordenador_ref_pesquisador || data.coordenador_ref_pesquisador.trim() === '') {
          setSubmitError('Selecione o coordenador do projeto.');
          return;
        }
        payload.coordenador_ref_pesquisador = data.coordenador_ref_pesquisador.trim();
      }

      const projeto = await projetoService.criar(
        payload as unknown as Parameters<typeof projetoService.criar>[0],
      );
      setCodigoCriado(projeto.codigo);
      setProjetoCriadoId(projeto.id);
      setSucesso(true);
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(
          err,
          'Erro ao criar projeto. Tente novamente.',
        ),
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Novo Projeto</h2>
          <p className="text-slate-700 font-medium">Configure os parâmetros básicos do projeto.</p>
        </div>
        <button
          onClick={() => navigate('/projetos')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
              Identificação
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Título do Projeto
              </label>
              <input
                type="text"
                {...register('titulo')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900"
                placeholder="Ex: Desenvolvimento de Novas Baterias..."
              />
              {errors.titulo && (
                <p className="text-xs text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Código (opcional)
              </label>
              <input
                type="text"
                {...register('codigo')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-black text-sm uppercase tracking-wider text-slate-900"
                placeholder="Gerado automaticamente"
              />
              {errors.codigo && (
                <p className="text-xs text-red-600">{errors.codigo.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Descrição (opcional)
            </label>
            <textarea
              rows={3}
              {...register('descricao')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900 resize-none"
              placeholder="Descreva o objetivo principal..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Início da Operação
              </label>
              <input
                type="date"
                {...register('data_inicio')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900"
              />
              {errors.data_inicio && (
                <p className="text-xs text-red-600">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Encerramento Previsto
              </label>
              <input
                type="date"
                {...register('data_fim')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900"
              />
              {errors.data_fim && (
                <p className="text-xs text-red-600">{errors.data_fim.message}</p>
              )}
            </div>
          </div>
        </section>

        {!isCoordenador && (
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                Coordenador
              </h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Selecione um pesquisador-servidor do Banco Especialista para ser o
              responsável pelo projeto.
            </p>

            {pesquisadorSelecionado ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-900 truncate">
                      {pesquisadorSelecionado.nome}
                    </p>
                    <p className="text-xs font-medium text-emerald-700">
                      Matrícula: {pesquisadorSelecionado.matricula}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={limparPesquisadorSelecionado}
                  className="text-xs font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={pesquisadorTermo}
                    onChange={(e) => setPesquisadorTermo(e.target.value)}
                    placeholder="Buscar pesquisador por nome ou matrícula..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900"
                  />
                  {buscandoPesquisadores && (
                    <Loader2
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
                    />
                  )}
                </div>

                {pesquisadorErro && (
                  <p className="text-xs text-red-600">{pesquisadorErro}</p>
                )}

                {!buscandoPesquisadores && pesquisadores.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Nenhum pesquisador-servidor encontrado.
                  </p>
                )}

                {pesquisadores.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white">
                    {pesquisadores.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => selecionarPesquisador(p)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                            {p.nome
                              .split(' ')
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {p.nome}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              {p.matricula}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {errors.coordenador_ref_pesquisador && (
                  <p className="text-xs text-red-600">
                    {errors.coordenador_ref_pesquisador.message}
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {isCoordenador && (
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                Coordenador
              </h3>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Você será o coordenador deste projeto.
              {user?.nome ? ` Responsável: ${user.nome}.` : ''}
            </p>
          </section>
        )}

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
              Fontes de Financiamento
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-black text-slate-800">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />
                Empresa*
              </label>
              <div className="space-y-1">
                <Controller
                  name="valor_empresa"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrencyBRL(field.value)}
                      onChange={(e) => field.onChange(parseCurrencyBRL(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900"
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {errors.valor_empresa && (
                  <p className="text-xs text-red-600">{errors.valor_empresa.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-black text-slate-800">
                <input
                  type="checkbox"
                  {...register('fonte_embrapii')}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />
                EMBRAPII
              </label>
              <div className="space-y-1">
                <Controller
                  name="valor_embrapii"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!fonteEmbrapii}
                      value={formatCurrencyBRL(field.value)}
                      onChange={(e) => field.onChange(parseCurrencyBRL(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {errors.valor_embrapii && (
                  <p className="text-xs text-red-600">{errors.valor_embrapii.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm font-black text-slate-800">
                <input
                  type="checkbox"
                  {...register('fonte_sebrae')}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />
                SEBRAE
              </label>
              <div className="space-y-1">
                <Controller
                  name="valor_sebrae"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!fonteSebrae}
                      value={formatCurrencyBRL(field.value)}
                      onChange={(e) => field.onChange(parseCurrencyBRL(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {errors.valor_sebrae && (
                  <p className="text-xs text-red-600">{errors.valor_sebrae.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                Total das Fontes
              </span>
              <strong className="text-lg font-black text-emerald-900">
                {totalFontes.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-6 pt-4">
          <button
            type="button"
            onClick={() => navigate('/projetos')}
            className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
          >
            <Save size={18} />
            {isSubmitting ? 'Salvando...' : 'Cadastrar Projeto'}
          </button>
        </div>
      </form>

      {sucesso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setSucesso(false)}
          />
          <div className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-base font-bold text-slate-900">Projeto criado</h3>
                <p className="text-xs text-slate-500 mt-1">
                  O projeto <span className="text-blue-600 font-bold">{codigoCriado}</span> foi cadastrado com sucesso.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setSucesso(false)}
                className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => projetoCriadoId && navigate(`/projetos/${projetoCriadoId}`)}
                className="py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
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