import { useEffect, useRef, useState } from 'react';
import { Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { CategoriaBolsa, FonteFinanciamento } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { parametroService } from '@/services/parametroService';
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

interface PreviewState {
  valorBolsa: number | null;
  validacaoCh: {
    valido: boolean;
    chTotal: number;
    chOutros: number;
    limite: number;
    mensagem?: string;
  } | null;
  loading: boolean;
  erroBolsa?: string;
}

const DEBOUNCE_MS = 400;

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
    valorBolsa: null,
    validacaoCh: null,
    loading: false,
  });

  // Debounce para não bombardear a API a cada tecla
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!membro.data_inicio || !membro.carga_horaria_semanal) {
      setPreview((p) => ({ ...p, valorBolsa: null, validacaoCh: null }));
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);

    setPreview((p) => ({ ...p, loading: true, erroBolsa: undefined }));

    timerRef.current = window.setTimeout(async () => {
      try {
        const [bolsa, validacao] = await Promise.all([
          parametroService
            .calcularBolsa({
              categoria: membro.categoria_bolsa,
              carga_horaria_semanal: membro.carga_horaria_semanal,
              data_referencia: membro.data_inicio,
            })
            .catch((err) => {
              const msg =
                err?.response?.data?.detail ??
                'Não foi possível calcular a bolsa para esta categoria/data.';
              setPreview((p) => ({ ...p, erroBolsa: msg }));
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
          valorBolsa: bolsa?.valor ?? null,
          validacaoCh: validacao
            ? {
                valido: validacao.valido,
                chTotal: validacao.ch_total,
                chOutros: validacao.ch_alocada_em_outros_projetos,
                limite: validacao.limite_semanal,
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
  ]);

  useEffect(() => {
    // IMPORTANTE: NÃO propagar `valor_bolsa` para o estado do pai a cada
    // recálculo. O cálculo é executado sempre que `categoria_bolsa`,
    // `carga_horaria_semanal`, `data_inicio`, `data_fim` ou `ref_pesquisador`
    // mudam — e também na montagem inicial. Se propagarmos o resultado, o
    // estado local do pai sempre divergirá do clone persistido no backend, o
    // que faz o `persistirMudancas` disparar um PUT parasita em TODOS os
    // membros com `id` (mesmo quando o usuário não mexeu em nada).
    //
    // O `valor_bolsa` é um campo derivado (calculado pelo `ParametroService`
    // do backend no momento de `incluirMembro`/`atualizarMembro`). Não há
    // razão para a UI replicar esse estado — o backend é a fonte da verdade.
    //
    // Quando o usuário realmente EDITA a categoria, carga horária ou data de
    // início, o `onChange` dos inputs (`MembroEditor.tsx` abaixo) já propaga
    // essas mudanças para o pai via `onChange({ categoria_bolsa, ... })`, e
    // o `membroMudou()` no `AlteracaoPage` detecta a divergência e dispara
    // o PUT. O backend recalcula o `valor_bolsa` automaticamente.
    return;
  }, [preview.valorBolsa]);

  useEffect(() => {
    onValorPreviewChange?.(preview.valorBolsa);
  }, [onValorPreviewChange, preview.valorBolsa]);

  const validacao = preview.validacaoCh;
  const chInvalida = validacao && !validacao.valido;
  const opcoesFonte =
    fontesDisponiveis && fontesDisponiveis.length > 0
      ? fontesDisponiveis
      : Object.values(FonteFinanciamento);

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
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>

        {/* Feedback de validação em tempo real */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Card: Valor da bolsa calculado */}
          <div
            className={cn(
              'p-3 rounded border flex items-center justify-between text-xs',
              preview.erroBolsa
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {preview.loading ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : preview.erroBolsa ? (
                <AlertTriangle size={14} className="shrink-0" />
              ) : (
                <CheckCircle2 size={14} className="shrink-0" />
              )}
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {preview.erroBolsa ? 'Bolsa' : 'Valor calculado'}
              </span>
            </div>
            <span className="font-bold text-sm whitespace-nowrap">
              {preview.loading
                ? '...'
                : preview.erroBolsa
                  ? 'Indisponível'
                  : preview.valorBolsa !== null
                    ? `R$ ${preview.valorBolsa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
            </span>
          </div>

          {/* Card: Validação de CH global */}
          {validacao && (
            <div
              className={cn(
                'p-3 rounded border flex items-center justify-between text-xs',
                validacao.valido
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800',
              )}
            >
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
              {!validacao.valido && validacao.mensagem ? (
                <span className="text-[10px] font-medium truncate" title={validacao.mensagem}>
                  excede
                </span>
              ) : (
                <span className="text-[10px] font-medium">
                  +{validacao.chOutros}h em outros projetos
                </span>
              )}
            </div>
          )}

          {preview.erroBolsa && (
            <p className="text-[10px] text-amber-700 col-span-full italic">{preview.erroBolsa}</p>
          )}
        </div>
      </div>
    </div>
  );
}
