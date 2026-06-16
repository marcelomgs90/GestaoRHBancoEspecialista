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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { solicitacaoService } from '@/services/solicitacaoService';
import { projetoService } from '@/services/projetoService';
import {
  FONTE_LABELS,
  FonteFinanciamento,
  STATUS_SOLICITACAO_LABELS,
  StatusSolicitacao,
  TIPO_SOLICITACAO_LABELS,
} from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { usePerfil } from '@/hooks/usePerfil';
import { cn } from '@/lib/cn';
import type { ComparacaoResponse, MembroComparacao, Solicitacao } from '@/types/solicitacao';
import type { Projeto } from '@/types/projeto';

const STATUS_COLORS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.EM_EDICAO]: 'bg-slate-100 text-slate-700 border-slate-200',
  [StatusSolicitacao.SUBMETIDA]: 'bg-amber-50 text-amber-700 border-amber-200',
  [StatusSolicitacao.APROVADA]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [StatusSolicitacao.REJEITADA]: 'bg-red-50 text-red-700 border-red-200',
};

const FONTES_ORDENADAS: FonteFinanciamento[] = [
  FonteFinanciamento.EMPRESA,
  FonteFinanciamento.EMBRAPII,
  FonteFinanciamento.SEBRAE,
];

export default function SolicitacaoComparacaoPage() {
  const { id_solicitacao } = useParams<{ id_solicitacao: string }>();
  const navigate = useNavigate();
  const { podeAprovarSolicitacao } = usePerfil();

  const [comparacao, setComparacao] = useState<ComparacaoResponse | null>(null);
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [aproandoId, setAprovandoId] = useState<number | null>(null);
  const [erroAprovar, setErroAprovar] = useState<string | null>(null);

  const [showRejeitarModal, setShowRejeitarModal] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [justificativaRejeicao, setJustificativaRejeicao] = useState('');
  const [erroRejeitar, setErroRejeitar] = useState<string | null>(null);

  const [showAprovarModal, setShowAprovarModal] = useState(false);

  const solicitacaoId = Number(id_solicitacao);

  useEffect(() => {
    if (!solicitacaoId) return;
    Promise.all([
      solicitacaoService.comparar(solicitacaoId),
      solicitacaoService.obter(solicitacaoId),
    ])
      .then(async ([comp, sol]) => {
        setComparacao(comp);
        setSolicitacao(sol);
        try {
          const proj = await projetoService.obter(sol.projeto_id);
          setProjeto(proj);
        } catch {
          setProjeto(null);
        }
      })
      .catch(() => setErro('Não foi possível carregar a comparação.'))
      .finally(() => setIsLoading(false));
  }, [solicitacaoId]);

const handleAprovar = async () => {
    if (!solicitacaoId) return;
    setAprovandoId(solicitacaoId);
    setErroAprovar(null);
    try {
      const atualizada = await solicitacaoService.aprobar(solicitacaoId);
      setSolicitacao(atualizada);
      setShowAprovarModal(false);
    } catch {
      setErroAprovar(`Erro ao aprobar solicitação #${solicitacaoId}.`);
    } finally {
      setAprovandoId(null);
    }
  };

  const handleRejeitar = async () => {
    if (!solicitacaoId) return;
    setRejeitando(true);
    setErroRejeitar(null);
    try {
      const atualizada = await solicitacaoService.rejeitar(
        solicitacaoId,
        justificativaRejeicao || undefined,
      );
      setSolicitacao(atualizada);
      setShowRejeitarModal(false);
      setJustificativaRejeicao('');
    } catch {
      setErroRejeitar(`Erro ao rejeitar solicitação #${solicitacaoId}.`);
    } finally {
      setRejeitando(false);
    }
  };

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
            {projeto && (
              <span className="text-slate-900 normal-case tracking-normal">
                · {projeto.codigo}
              </span>
            )}
          </p>
          {solicitacao && (
            <div className="mt-2 flex items-center justify-end gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black rounded uppercase tracking-widest border border-slate-200">
                {TIPO_SOLICITACAO_LABELS[solicitacao.tipo] ?? solicitacao.tipo}
              </span>
              <span
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border',
                  STATUS_COLORS[solicitacao.status] ??
                    'bg-slate-100 text-slate-700 border-slate-200',
                )}
              >
                {STATUS_SOLICITACAO_LABELS[solicitacao.status] ?? solicitacao.status}
              </span>
            </div>
          )}
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

      {/* Justificativa da rejeição (caso exista) */}
      {solicitacao?.justificativa && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1">
            Justificativa da Rejeição
          </p>
          <p className="text-sm text-slate-700">{solicitacao.justificativa}</p>
        </div>
      )}

      {/* Botões de aprovação (apenas para SUBMETIDA e com permissão) */}
      {podeAprovarSolicitacao && solicitacao?.status === StatusSolicitacao.SUBMETIDA && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={() => {
              setShowRejeitarModal(true);
              setJustificativaRejeicao('');
              setErroRejeitar(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <XCircle size={14} />
            Rejeitar
          </button>
          <button
            onClick={() => setShowAprovarModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <CheckCircle2 size={14} />
            Aprovar
          </button>
        </div>
      )}

      {/* Modal de aprovação */}
      {showAprovarModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Aprovar Solicitação</h3>
            <p className="text-slate-500 font-medium mb-6">
              Você deseja realmente aprobar a solicitação #{solicitacaoId}?
            </p>
            {erroAprovar && (
              <p className="text-red-600 text-xs mb-4">{erroAprovar}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAprovarModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAprovar}
                disabled={aproandoId === solicitacaoId}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {aproandoId === solicitacaoId ? 'Aprovando...' : 'Aprovar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de rejeição */}
      {showRejeitarModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Rejeitar Solicitação</h3>
            <p className="text-slate-500 font-medium mb-2">
              Você deseja realmente rejeitar a solicitação #{solicitacaoId}?
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Deseja adicionar uma justificativa?
            </p>
            <textarea
              value={justificativaRejeicao}
              onChange={(e) => setJustificativaRejeicao(e.target.value)}
              placeholder="Justificativa (opcional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 resize-none"
              rows={3}
            />
            {erroRejeitar && (
              <p className="text-red-600 text-xs mt-2">{erroRejeitar}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejeitarModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={rejeitando}
                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {rejeitando ? 'Rejeitando...' : 'Rejeitar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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
