import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  Filter,
  AlertCircle,
  GitCompare,
  Send,
} from 'lucide-react';
import { solicitacaoService } from '@/services/solicitacaoService';
import { projetoService } from '@/services/projetoService';
import {
  STATUS_SOLICITACAO_LABELS,
  TIPO_SOLICITACAO_LABELS,
  TipoSolicitacao,
  StatusSolicitacao,
} from '@/types/enums';
import { usePerfil } from '@/hooks/usePerfil';
import type { Solicitacao } from '@/types/solicitacao';
import type { Projeto } from '@/types/projeto';

const STATUS_COLORS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.EM_EDICAO]: 'bg-slate-100 text-slate-600 border-slate-200',
  [StatusSolicitacao.SUBMETIDA]: 'bg-amber-50 text-amber-700 border-amber-100',
  [StatusSolicitacao.APROVADA]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [StatusSolicitacao.REJEITADA]: 'bg-red-50 text-red-700 border-red-100',
};

export default function SolicitacoesListPage() {
  const navigate = useNavigate();
  const { podeCriarProjeto } = usePerfil();

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitacao | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroSubmeter, setErroSubmeter] = useState<string | null>(null);
  const [submetendoId, setSubmetendoId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ss, ps] = await Promise.all([
          solicitacaoService.listar(),
          projetoService.listar(),
        ]);
        setSolicitacoes(ss);
        setProjetos(ps);
      } catch {
        setErro('Nao foi possivel carregar as solicitacoes.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const filtradas = solicitacoes.filter((s) => {
    if (filtroTipo && s.tipo !== filtroTipo) return false;
    if (filtroStatus && s.status !== filtroStatus) return false;
    return true;
  });

  const nomeProjeto = (id: number) =>
    projetos.find((p) => p.id === id)?.codigo ?? `Projeto ${id}`;

  const handleSubmeter = async (sol: Solicitacao) => {
    setSubmetendoId(sol.id);
    setErroSubmeter(null);
    try {
      const atualizada = await solicitacaoService.submeter(sol.id);
      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === sol.id ? atualizada : s)),
      );
    } catch {
      setErroSubmeter(`Erro ao submeter solicitacao #${sol.id}.`);
    } finally {
      setSubmetendoId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Solicitacoes de RH</h2>
          <p className="text-slate-700 text-sm mt-1">
            Historico de implantacoes e alteracoes de quadro.
          </p>
        </div>
        {podeCriarProjeto && (
          <button
            onClick={() => navigate('/projetos')}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} className="mr-2" />
            Nova via Projeto
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-slate-400 shrink-0" />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoSolicitacao | '')}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium outline-none focus:border-slate-400 transition-all text-slate-700"
        >
          <option value="">Todos os tipos</option>
          {Object.values(TipoSolicitacao).map((t) => (
            <option key={t} value={t}>
              {TIPO_SOLICITACAO_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusSolicitacao | '')}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium outline-none focus:border-slate-400 transition-all text-slate-700"
        >
          <option value="">Todos os status</option>
          {Object.values(StatusSolicitacao).map((s) => (
            <option key={s} value={s}>
              {STATUS_SOLICITACAO_LABELS[s]}
            </option>
          ))}
        </select>
        {(filtroTipo || filtroStatus) && (
          <button
            onClick={() => { setFiltroTipo(''); setFiltroStatus(''); }}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">Carregando solicitacoes...</p>
        </div>
      )}

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {erroSubmeter && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{erroSubmeter}</span>
        </div>
      )}

      {!isLoading && !erro && (
        <>
          {filtradas.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList size={40} className="mx-auto mb-4 text-slate-200" />
              <p className="text-sm text-slate-400 font-medium">Nenhuma solicitacao encontrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((sol, idx) => (
                <motion.div
                  key={sol.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group bg-white border border-slate-200 p-6 rounded-lg hover:border-slate-400 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div
                      onClick={() => navigate(`/projetos/${sol.projeto_id}`)}
                      className="flex-1 space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                          #{sol.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {sol.identificador}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{nomeProjeto(sol.projeto_id)}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tipo</p>
                        <span className="text-xs font-bold text-slate-700">
                          {TIPO_SOLICITACAO_LABELS[sol.tipo] ?? sol.tipo}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLORS[sol.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                        >
                          {STATUS_SOLICITACAO_LABELS[sol.status] ?? sol.status}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/solicitacoes/${sol.id}/comparacao`);
                        }}
                        title="Comparar versoes (antes/depois)"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <GitCompare size={12} />
                        Comparar
                      </button>

                      {sol.status === StatusSolicitacao.EM_EDICAO && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubmeter(sol);
                          }}
                          disabled={submetendoId === sol.id}
                          title="Submeter solicitacao"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={12} className={submetendoId === sol.id ? 'animate-pulse' : ''} />
                          {submetendoId === sol.id ? 'Submetendo...' : 'Submeter'}
                        </button>
                      )}

                      <div className="hidden lg:block">
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
