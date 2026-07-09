import { useEffect, useRef, useState } from 'react';
import {
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
} from 'lucide-react';
import { CategoriaBolsa, FonteFinanciamento, FONTES_RH_OPERACIONAIS } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { parametroService } from '@/services/parametroService';
import type {
  AlocacaoConcorrente,
  ResumoPesquisador,
} from '@/types/solicitacao';
import type { MembroCreate } from '@/types/solicitacao';
import { cn } from '@/lib/cn';

export interface MembroLocalProps extends MembroCreate {
  _tempId: string;
  /** id real no backend (presente em alterações, ausente em inclusões pendentes) */
  id?: number;
  /** valor calculado da bolsa (preenchido após cálculo ou ao carregar membros existentes) */
  valor_bolsa?: number;
}

interface Props {
  membro: MembroLocalProps;
  onChange: (changes: Partial<MembroLocalProps>) => void;
  onRemove: () => void;
  projetoId?: number;
  projetoDataInicio?: string;
  projetoDataFim?: string;
  fontesDisponiveis?: FonteFinanciamento[];
  onValorPreviewChange?: (valor: number | null) => void;
}

interface PreviewBolsa {
  valor_mensal: number | null;
  valor_periodo: number | null;
  valor_hora: number | null;
  erro?: string;
}

interface PreviewCh {
  valido: boolean;
  chTotal: number;
  chOutros: number;
  limite: number;
  alocacoes: AlocacaoConcorrente[];
  mensagem?: string;
}

interface PreviewState {
  bolsa: PreviewBolsa;
  validacaoCh: PreviewCh | null;
  loading: boolean;
}

const DEBOUNCE_MS = 400;

const formatCurrencyBRL = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

export function MembroEditor({
  membro,
  onChange,
  onRemove,
  projetoId,
  projetoDataInicio,
  projetoDataFim,
  fontesDisponiveis,
  onValorPreviewChange,
}: Props) {
  const [preview, setPreview] = useState<PreviewState>({
    bolsa: { valor_mensal: null, valor_periodo: null, valor_hora: null },
    validacaoCh: null,
    loading: false,
  });
  const [resumoExpanded, setResumoExpanded] = useState(false);
  const [resumo, setResumo] = useState<ResumoPesquisador | null>(null);
  const [resumoLoading, setResumoLoading] = useState(false);
  const [resumoErro, setResumoErro] = useState<string | null>(null);
  const [chExpanded, setChExpanded] = useState(false);

  const timerRef = useRef<number | null>(null);
  const resumoLoadedRef = useRef<string | null>(null);

  const dataInicioValida = !!membro.data_inicio;
  const dataFimValida = !!membro.data_fim;
  const chValida = !!membro.carga_horaria_semanal;
  const podeCalcular = dataInicioValida && chValida;

  useEffect(() => {
    if (!podeCalcular) {
      setPreview((p) => ({
        ...p,
        bolsa: { valor_mensal: null, valor_periodo: null, valor_hora: null },
        validacaoCh: null,
      }));
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);

    setPreview((p) => ({ ...p, loading: true, bolsa: { ...p.bolsa, erro: undefined } }));

    timerRef.current = window.setTimeout(async () => {
      try {
        const [bolsa, validacao] = await Promise.all([
          parametroService
            .calcularBolsa({
              categoria: membro.categoria_bolsa,
              carga_horaria_semanal: membro.carga_horaria_semanal,
              data_referencia: membro.data_inicio,
              data_fim: membro.data_fim,
            })
            .catch((err) => {
              const msg =
                err?.response?.data?.detail ??
                'Não foi possível calcular a bolsa para esta categoria/data.';
              setPreview((p) => ({
                ...p,
                bolsa: { valor_mensal: null, valor_periodo: null, valor_hora: null, erro: msg },
              }));
              return null;
            }),
          parametroService
            .validarChGlobal({
              ref_pesquisador: membro.ref_pesquisador,
              carga_horaria_semanal: membro.carga_horaria_semanal,
              data_inicio: membro.data_inicio,
              data_fim: membro.data_fim,
              projeto_id_excluir: projetoId,
            })
            .catch(() => null),
        ]);

        setPreview({
          bolsa: bolsa
            ? {
                valor_mensal: bolsa.valor_mensal,
                valor_periodo: dataFimValida ? bolsa.valor_periodo : null,
                valor_hora: bolsa.valor_hora,
              }
            : {
                valor_mensal: null,
                valor_periodo: null,
                valor_hora: null,
                erro: preview.bolsa.erro,
              },
          validacaoCh: validacao
            ? {
                valido: validacao.valido,
                chTotal: validacao.ch_total,
                chOutros: validacao.ch_alocada_em_outros_projetos,
                limite: validacao.limite_semanal,
                alocacoes: validacao.alocacoes_concorrentes ?? [],
                mensagem: validacao.mensagem,
              }
            : null,
          loading: false,
        });
      } catch {
        setPreview((p) => ({ ...p, loading: false }));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [
    membro.categoria_bolsa,
    membro.carga_horaria_semanal,
    membro.data_inicio,
    membro.data_fim,
    membro.ref_pesquisador,
    projetoId,
    podeCalcular,
    dataFimValida,
  ]);

  useEffect(() => {
    onValorPreviewChange?.(preview.bolsa.valor_mensal);
  }, [onValorPreviewChange, preview.bolsa.valor_mensal]);

  const carregarResumo = async () => {
    if (!membro.ref_pesquisador) return;
    setResumoLoading(true);
    setResumoErro(null);
    try {
      const r = await parametroService.resumoPesquisador({
        ref_pesquisador: membro.ref_pesquisador,
        data_inicio: membro.data_inicio || undefined,
        data_fim: membro.data_fim || undefined,
      });
      setResumo(r);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setResumoErro(
        e?.response?.data?.detail ?? 'Não foi possível carregar o resumo do pesquisador.',
      );
    } finally {
      setResumoLoading(false);
    }
  };

  const toggleResumo = () => {
    const prox = !resumoExpanded;
    setResumoExpanded(prox);
    if (prox && resumoLoadedRef.current !== membro.ref_pesquisador) {
      resumoLoadedRef.current = membro.ref_pesquisador;
      void carregarResumo();
    }
  };

  const validacao = preview.validacaoCh;
  const chInvalida = validacao && !validacao.valido;
  const opcoesFonte =
    fontesDisponiveis && fontesDisponiveis.length > 0
      ? fontesDisponiveis
      : FONTES_RH_OPERACIONAIS;

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
      <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-600 shrink-0">
        {membro.nome_pesquisador.charAt(0)}
      </div>

      <div className="flex-1 space-y-4 w-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-lg text-slate-900 leading-none mb-2">
              {membro.nome_pesquisador}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              REF: {membro.ref_pesquisador}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="p-2 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
            aria-label="Remover membro"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Categoria
            </label>
            <select
              value={membro.categoria_bolsa}
              onChange={(e) =>
                onChange({ categoria_bolsa: e.target.value as CategoriaBolsa })
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium outline-none focus:border-slate-900"
            >
              {Object.entries(CATEGORIA_BOLSA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label.funcao} — {label.nivel}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Fonte
            </label>
            <select
              value={membro.fonte_financiamento}
              onChange={(e) =>
                onChange({ fonte_financiamento: e.target.value as FonteFinanciamento })
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium outline-none focus:border-slate-900"
            >
              {opcoesFonte.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              CH Semanal (h)
            </label>
            <input
              type="number"
              min={1}
              max={80}
              value={membro.carga_horaria_semanal}
              onChange={(e) =>
                onChange({ carga_horaria_semanal: parseInt(e.target.value) || 1 })
              }
              className={cn(
                'w-full px-3 py-2 bg-white border rounded text-xs font-bold outline-none focus:border-slate-900',
                chInvalida ? 'border-red-400 text-red-700' : 'border-slate-300',
              )}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Início
            </label>
            <input
              type="date"
              value={membro.data_inicio}
              min={projetoDataInicio}
              max={projetoDataFim}
              onChange={(e) => onChange({ data_inicio: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Fim
            </label>
            <input
              type="date"
              value={membro.data_fim ?? ''}
              min={membro.data_inicio || projetoDataInicio}
              max={projetoDataFim}
              onChange={(e) => onChange({ data_fim: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Trio de cards: Valor (mensal + período + hora) + CH Global */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Card: Valor da bolsa calculado — trio */}
          <div
            className={cn(
              'p-3 rounded border text-xs',
              preview.bolsa.erro
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {preview.loading ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : preview.bolsa.erro ? (
                <AlertTriangle size={14} className="shrink-0" />
              ) : (
                <CheckCircle2 size={14} className="shrink-0" />
              )}
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Valor calculado
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  por hora
                </p>
                <p className="font-bold text-sm">
                  {preview.bolsa.valor_hora !== null
                    ? formatCurrencyBRL(preview.bolsa.valor_hora)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  por mês
                </p>
                <p className="font-bold text-sm">
                  {preview.bolsa.valor_mensal !== null
                    ? formatCurrencyBRL(preview.bolsa.valor_mensal)
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  no período
                </p>
                <p className="font-bold text-sm">
                  {dataFimValida && preview.bolsa.valor_periodo !== null
                    ? formatCurrencyBRL(preview.bolsa.valor_periodo)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Validação de CH global */}
          {validacao && (
            <div
              className={cn(
                'p-3 rounded border text-xs',
                validacao.valido
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800',
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {validacao.valido ? (
                    <CheckCircle2 size={14} className="shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="shrink-0" />
                  )}
                  <span className="font-bold uppercase tracking-wider text-[10px] truncate">
                    CH Global: {validacao.chTotal}h
                    {validacao.limite > 0 ? ` / ${validacao.limite}h` : ''}
                  </span>
                </div>
                {!validacao.valido ? (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    title={validacao.mensagem}
                  >
                    excede
                  </span>
                ) : (
                  <span className="text-[10px] font-bold">
                    +{validacao.chOutros}h em {validacao.alocacoes.length} outro(s)
                  </span>
                )}
              </div>
              {validacao.alocacoes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChExpanded((e) => !e)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  {chExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                  {chExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {chExpanded && validacao.alocacoes.length > 0 && (
                <ul className="mt-2 space-y-1 text-[10px]">
                  {validacao.alocacoes.map((a, idx) => (
                    <li
                      key={`${a.projeto_id}-${idx}`}
                      className="flex items-center justify-between gap-2 border-t border-current/20 pt-1"
                    >
                      <span className="font-bold truncate">
                        {a.projeto_codigo || '(sem código)'}
                      </span>
                      <span className="font-medium tabular-nums">
                        {a.carga_horaria_semanal}h × {formatCurrencyBRL(a.valor_hora_medio)}/h
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!validacao.valido && validacao.mensagem && (
                <p className="mt-2 text-[10px] italic">{validacao.mensagem}</p>
              )}
            </div>
          )}

          {preview.bolsa.erro && (
            <p className="text-[10px] text-amber-700 col-span-full italic">{preview.bolsa.erro}</p>
          )}
        </div>

        {/* Seção colapsável: Resumo do Pesquisador */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={toggleResumo}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            <CircleDollarSign size={12} className="text-slate-400" />
            Resumo do Pesquisador
            {resumoExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {resumoExpanded && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50/50 p-3">
              {resumoLoading && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500 py-2">
                  <Loader2 size={12} className="animate-spin" />
                  Carregando resumo consolidado...
                </div>
              )}
              {resumoErro && (
                <p className="text-[10px] text-red-700 italic">{resumoErro}</p>
              )}
              {resumo && !resumoLoading && !resumoErro && (
                <>
                  {resumo.alocacoes.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">
                      Sem alocações vigentes para este pesquisador.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-widest border-b border-slate-200">
                              <th className="pb-2">Projeto</th>
                              <th className="pb-2">Fonte</th>
                              <th className="pb-2 text-center">CH</th>
                              <th className="pb-2 text-right">Valor/h</th>
                              <th className="pb-2 text-right">Valor/mês</th>
                              <th className="pb-2">Período</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {resumo.alocacoes.map((a, idx) => (
                              <tr key={`${a.projeto_id}-${idx}`}>
                                <td className="py-1.5 font-bold text-slate-900 truncate max-w-[140px]">
                                  {a.projeto_codigo || '—'}
                                </td>
                                <td className="py-1.5">{a.fonte_financiamento}</td>
                                <td className="py-1.5 text-center tabular-nums">
                                  {a.carga_horaria_semanal}h
                                </td>
                                <td className="py-1.5 text-right tabular-nums">
                                  {formatCurrencyBRL(a.valor_hora_medio)}
                                </td>
                                <td className="py-1.5 text-right tabular-nums">
                                  {formatCurrencyBRL(a.valor_bolsa_mensal)}
                                </td>
                                <td className="py-1.5 text-slate-500">
                                  {a.data_inicio}
                                  {' — '}
                                  {a.data_fim ?? 'em aberto'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Custo total/mês
                          </p>
                          <p className="font-bold text-sm text-slate-900">
                            {formatCurrencyBRL(resumo.custo_total_mensal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            CH total
                          </p>
                          <p className="font-bold text-sm text-slate-900">{resumo.ch_total}h</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Valor/h médio
                          </p>
                          <p className="font-bold text-sm text-slate-900">
                            {formatCurrencyBRL(resumo.valor_hora_medio_ponderado)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Projetos / fontes
                          </p>
                          <p className="font-bold text-sm text-slate-900">
                            {resumo.total_projetos} / {resumo.total_fontes}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
