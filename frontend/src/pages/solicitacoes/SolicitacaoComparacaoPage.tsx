import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Minus,
  Edit3,
  GitCompare,
} from 'lucide-react';
import { solicitacaoService } from '@/services/solicitacaoService';
import { FONTE_LABELS, FonteFinanciamento } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { cn } from '@/lib/cn';
import type { ComparacaoResponse, MembroComparacao } from '@/types/solicitacao';

const FONTES_ORDENADAS: FonteFinanciamento[] = [
  FonteFinanciamento.EMPRESA,
  FonteFinanciamento.EMBRAPII,
  FonteFinanciamento.SEBRAE,
  FonteFinanciamento.IFPB,
];

export default function SolicitacaoComparacaoPage() {
  const { id_solicitacao } = useParams<{ id_solicitacao: string }>();
  const navigate = useNavigate();

  const [comparacao, setComparacao] = useState<ComparacaoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const solicitacaoId = Number(id_solicitacao);

  useEffect(() => {
    if (!solicitacaoId) return;
    solicitacaoService
      .comparar(solicitacaoId)
      .then(setComparacao)
      .catch(() => setErro('Não foi possível carregar a comparação.'))
      .finally(() => setIsLoading(false));
  }, [solicitacaoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Carregando comparação...</p>
      </div>
    );
  }

  if (erro || !comparacao) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/solicitacoes')}
          className="flex items-center text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-widest gap-1 cursor-pointer"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro ?? 'Comparação não disponível.'}</span>
        </div>
      </div>
    );
  }

  const totalDif =
    comparacao.diferencas.inclusoes.length +
    comparacao.diferencas.alteracoes.length +
    comparacao.diferencas.encerramentos.length;

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <button
          onClick={() => navigate('/solicitacoes')}
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Solicitações
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-900">Comparação de Versões</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center justify-end gap-2">
            <GitCompare size={12} />
            Solicitação #{solicitacaoId}
          </p>
        </div>
      </div>

      {/* Resumo de diferenças */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DiffBox
          label="Inclusões"
          count={comparacao.diferencas.inclusoes.length}
          icon={<Plus size={20} />}
          tone="emerald"
        />
        <DiffBox
          label="Alterações"
          count={comparacao.diferencas.alteracoes.length}
          icon={<Edit3 size={20} />}
          tone="amber"
        />
        <DiffBox
          label="Encerramentos"
          count={comparacao.diferencas.encerramentos.length}
          icon={<Minus size={20} />}
          tone="red"
        />
      </div>

      {totalDif === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-bold text-slate-500">Nenhuma diferença entre as versões.</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            As equipes Atual e Proposta são idênticas
          </p>
        </div>
      )}

      {/* Lista detalhada de diferenças */}
      {totalDif > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Detalhamento das Mudanças
          </h3>
          <div className="space-y-2">
            {comparacao.diferencas.inclusoes.map((inc, idx) => (
              <DiffRow
                key={`inc-${idx}`}
                tone="emerald"
                icon={<Plus size={14} />}
                title={inc.pesquisador}
                detail={`Incluído em ${FONTE_LABELS[inc.fonte as FonteFinanciamento] ?? inc.fonte} como ${CATEGORIA_BOLSA_LABELS[inc.categoria as keyof typeof CATEGORIA_BOLSA_LABELS]?.nivel ?? inc.categoria}`}
              />
            ))}
            {comparacao.diferencas.alteracoes.map((alt, idx) => (
              <DiffRow
                key={`alt-${idx}`}
                tone="amber"
                icon={<Edit3 size={14} />}
                title={alt.pesquisador}
                detail={`${alt.campo}: ${String(alt.de)} -> ${String(alt.para)}`}
              />
            ))}
            {comparacao.diferencas.encerramentos.map((enc, idx) => (
              <DiffRow
                key={`enc-${idx}`}
                tone="red"
                icon={<Minus size={14} />}
                title={enc.pesquisador}
                detail={enc.motivo}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tabelas lado a lado por fonte */}
      <div className="space-y-6">
        {FONTES_ORDENADAS.map((fonte) => {
          const antes = comparacao.antes[fonte] ?? [];
          const depois = comparacao.depois[fonte] ?? [];

          if (antes.length === 0 && depois.length === 0) return null;

          // Mapa para identificar status linha-a-linha
          const refsAntes = new Set(antes.map((m) => m.ref_pesquisador));
          const refsDepois = new Set(depois.map((m) => m.ref_pesquisador));

          return (
            <motion.section
              key={fonte}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  {FONTE_LABELS[fonte] ?? fonte}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {antes.length} {'->'} {depois.length} membros
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-200">
                <VersaoColuna
                    titulo="Versão Atual (Antes)"
                  membros={antes}
                  tipo="antes"
                  refsContraparte={refsDepois}
                />
                <VersaoColuna
                    titulo="Versão Proposta (Depois)"
                  membros={depois}
                  tipo="depois"
                  refsContraparte={refsAntes}
                />
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

function DiffBox({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'amber' | 'red';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div className={cn('p-6 rounded-lg border flex items-center', tones[tone])}>
      <div className={cn('w-12 h-12 rounded flex items-center justify-center bg-white mr-4', tone === 'emerald' && 'text-emerald-600', tone === 'amber' && 'text-amber-600', tone === 'red' && 'text-red-600')}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </div>
  );
}

function DiffRow({
  tone,
  icon,
  title,
  detail,
}: {
  tone: 'emerald' | 'amber' | 'red';
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  const tones = {
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50/50 border-amber-100 text-amber-700',
    red: 'bg-red-50/50 border-red-100 text-red-700',
  };
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded border', tones[tone])}>
      <div className="w-8 h-8 rounded bg-white flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
        <p className="text-[11px] font-medium text-slate-600 truncate">{detail}</p>
      </div>
    </div>
  );
}

function VersaoColuna({
  titulo,
  membros,
  tipo,
  refsContraparte,
}: {
  titulo: string;
  membros: MembroComparacao[];
  tipo: 'antes' | 'depois';
  refsContraparte: Set<string>;
}) {
  return (
    <div className="p-6">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        {titulo}
      </p>
      {membros.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium italic py-4 text-center">
          Sem membros nesta fonte
        </p>
      ) : (
        <div className="space-y-2">
          {membros.map((m) => {
            const estaNoOutro = refsContraparte.has(m.ref_pesquisador);
            const destaque =
              tipo === 'depois' && !estaNoOutro
                ? 'novo'
                : tipo === 'antes' && !estaNoOutro
                  ? 'removido'
                  : 'mantido';
            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded border text-xs',
                  destaque === 'novo' && 'bg-emerald-50 border-emerald-200',
                  destaque === 'removido' && 'bg-red-50 border-red-200',
                  destaque === 'mantido' && 'bg-slate-50 border-slate-200',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{m.nome_pesquisador}</p>
                  <p className="text-[10px] font-medium text-slate-600 truncate">
                    {CATEGORIA_BOLSA_LABELS[m.categoria_bolsa]?.nivel ?? m.categoria_bolsa} —{' '}
                    {m.carga_horaria_semanal}h/sem
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap ml-3">
                  R$ {Number(m.valor_bolsa).toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
