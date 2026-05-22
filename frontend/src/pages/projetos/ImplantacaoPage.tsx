import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Users,
  Search,
  Trash2,
  FileCheck,
  History,
  CheckCircle2,
  X,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { CategoriaBolsa, FonteFinanciamento, TipoSolicitacao } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { cn } from '@/lib/cn';
import type { Projeto } from '@/types/projeto';
import type { MembroCreate } from '@/types/solicitacao';

// Tipo de membro em edicao na tela (antes de enviar ao backend)
interface MembroLocal extends MembroCreate {
  _tempId: string;
}

interface HistoryLog {
  id: string;
  type: 'ADD' | 'REMOVE' | 'UPDATE';
  nome: string;
  detail: string;
}

// Candidatos mockados ate existir endpoint do Banco de Especialistas
const CANDIDATOS_MOCK = [
  { ref: 'CAND-001', nome: 'Lucas Amado', categoria: CategoriaBolsa.PESQUISADOR_MASTER },
  { ref: 'CAND-002', nome: 'Carla Dias', categoria: CategoriaBolsa.PESQUISADOR_PLENO },
  { ref: 'CAND-003', nome: 'Bernardo Silva', categoria: CategoriaBolsa.PESQUISADOR_JUNIOR },
];

// Especialistas mockados ate existir endpoint do Banco de Especialistas
const ESPECIALISTAS_MOCK = [
  { ref: 'ESP-001', nome: 'Joao Silva', email: 'joao.silva@if.edu.br', ch_atual: 40 },
  { ref: 'ESP-002', nome: 'Maria Souza', email: 'maria.souza@if.edu.br', ch_atual: 20 },
  { ref: 'ESP-003', nome: 'Pedro Oliver', email: 'pedro.oliver@ext.com', ch_atual: 0 },
];

export default function ImplantacaoPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null);
  const [membros, setMembros] = useState<MembroLocal[]>([]);
  const [showSearch, setShowSearch] = useState<'candidatos' | 'especialistas' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [finalizando, setFinalizando] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const projetoId = Number(id_projeto);

  useEffect(() => {
    if (!projetoId) return;

    async function init() {
      try {
        const [p, ss] = await Promise.all([
          projetoService.obter(projetoId),
          solicitacaoService.listar(projetoId),
        ]);
        setProjeto(p);

        // Reutiliza solicitacao IMPLANTACAO em edicao, ou cria nova
        const existente = ss.find(
          (s) => s.tipo === TipoSolicitacao.IMPLANTACAO && s.status === 'EM_EDICAO',
        );
        if (existente) {
          setSolicitacaoId(existente.id);
          const ms = await solicitacaoService.listarMembros(existente.id);
          setMembros(
            ms.map((m) => ({
              _tempId: String(m.id),
              ref_pesquisador: m.ref_pesquisador,
              nome_pesquisador: m.nome_pesquisador,
              categoria_bolsa: m.categoria_bolsa,
              fonte_financiamento: m.fonte_financiamento,
              carga_horaria_semanal: m.carga_horaria_semanal,
              data_inicio: m.data_inicio,
              data_fim: m.data_fim,
            })),
          );
        } else {
          const nova = await solicitacaoService.criar({
            identificador: `IMP-${projetoId}-${Date.now()}`,
            projeto_id: projetoId,
            tipo: TipoSolicitacao.IMPLANTACAO,
          });
          setSolicitacaoId(nova.id);
        }
      } catch {
        setErro('Nao foi possivel inicializar a implantacao.');
      }
    }
    void init();
  }, [projetoId]);

  const log = (type: HistoryLog['type'], nome: string, detail: string) =>
    setHistory((prev) => [{ id: Math.random().toString(36).slice(2), type, nome, detail }, ...prev]);

  const addMembro = (ref: string, nome: string, categoria: CategoriaBolsa) => {
    const novoMembro: MembroLocal = {
      _tempId: Math.random().toString(36).slice(2),
      ref_pesquisador: ref,
      nome_pesquisador: nome,
      categoria_bolsa: categoria,
      fonte_financiamento: FonteFinanciamento.EMPRESA,
      carga_horaria_semanal: 20,
      data_inicio: projeto?.data_inicio ?? '',
      data_fim: projeto?.data_fim,
    };
    setMembros((prev) => [...prev, novoMembro]);
    log('ADD', nome, 'Adicionado a lista de designacao');
    setShowSearch(null);
    setSearchTerm('');
  };

  const removeMembro = (tempId: string) => {
    const m = membros.find((x) => x._tempId === tempId);
    if (m) log('REMOVE', m.nome_pesquisador, 'Removido da lista');
    setMembros((prev) => prev.filter((x) => x._tempId !== tempId));
  };

  const updateMembro = (tempId: string, changes: Partial<MembroCreate>) => {
    setMembros((prev) =>
      prev.map((m) => (m._tempId === tempId ? { ...m, ...changes } : m)),
    );
  };

  const handleFinalizar = async () => {
    if (!solicitacaoId || membros.length === 0) return;
    setFinalizando(true);
    setErro(null);
    try {
      for (const m of membros) {
        const { _tempId, ...dados } = m;
        void _tempId;
        await solicitacaoService.incluirMembro(solicitacaoId, dados);
      }
      setShowSuccessModal(true);
    } catch {
      setErro('Erro ao salvar membros. Tente novamente.');
    } finally {
      setFinalizando(false);
    }
  };

  const filtrarCandidatos = CANDIDATOS_MOCK.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filtrarEspecialistas = ESPECIALISTAS_MOCK.filter((e) =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <button
          onClick={() => navigate(`/projetos/${projetoId}`)}
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors group cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar ao Projeto
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-900">Implantacao / Alteracao de RH</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Projeto: <span className="text-slate-900">{projeto?.codigo ?? '...'}</span>
          </p>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowSearch('candidatos')}
          className="flex items-center p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm cursor-pointer"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded mr-6">
            <Users size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 uppercase tracking-tight text-sm">
              Processo Seletivo
            </p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Candidatos Aprovados — mock ate endpoint AIE
            </p>
          </div>
        </button>

        <button
          onClick={() => setShowSearch('especialistas')}
          className="flex items-center p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm cursor-pointer"
        >
          <div className="p-3 bg-slate-900 text-white rounded mr-6">
            <UserPlus size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 uppercase tracking-tight text-sm">
              Banco de Especialistas
            </p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Servidores e Remanejados — mock ate endpoint AIE
            </p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Designacoes Pendentes
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Aguardando finalizacao
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
            {membros.length} Pesquisadores
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {membros.map((m) => (
            <motion.div
              layout
              key={m._tempId}
              className="p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center"
            >
              <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-600 shrink-0">
                {m.nome_pesquisador.charAt(0)}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg text-slate-900 leading-none mb-2">
                      {m.nome_pesquisador}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      REF: {m.ref_pesquisador}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMembro(m._tempId)}
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
                      value={m.categoria_bolsa}
                      onChange={(e) =>
                        updateMembro(m._tempId, { categoria_bolsa: e.target.value as CategoriaBolsa })
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
                      value={m.fonte_financiamento}
                      onChange={(e) =>
                        updateMembro(m._tempId, { fonte_financiamento: e.target.value as FonteFinanciamento })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium outline-none focus:border-slate-900"
                    >
                      {Object.values(FonteFinanciamento).map((f) => (
                        <option key={f} value={f}>{f}</option>
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
                      value={m.carga_horaria_semanal}
                      onChange={(e) =>
                        updateMembro(m._tempId, { carga_horaria_semanal: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Inicio
                    </label>
                    <input
                      type="date"
                      value={m.data_inicio}
                      onChange={(e) => updateMembro(m._tempId, { data_inicio: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {membros.length === 0 && (
            <div className="p-24 text-center">
              <Users size={64} className="mx-auto mb-6 text-slate-100" />
              <p className="font-black text-slate-300 uppercase tracking-widest text-xs italic">
                Lista de designacao vazia
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
            Historico de Alteracoes
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <History size={14} />
            <span>{history.length} Eventos</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
          {history.map((log) => (
            <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div
                className={cn(
                  'w-10 h-10 rounded-md flex items-center justify-center font-bold text-[10px]',
                  log.type === 'ADD'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : log.type === 'REMOVE'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-blue-50 text-blue-600 border border-blue-100',
                )}
              >
                {log.type}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{log.nome}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{log.detail}</p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="p-8 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
              Nenhum evento nesta sessao
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-8 bg-slate-100 border border-slate-200 rounded-lg">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Pesquisadores a incluir
          </p>
          <p className="text-2xl font-bold text-slate-900">{membros.length}</p>
        </div>
        <button
          onClick={handleFinalizar}
          disabled={membros.length === 0 || finalizando || !solicitacaoId}
          className="flex items-center px-8 py-3 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale shadow-sm active:scale-95 cursor-pointer"
        >
          {finalizando ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-3"></div>
              Salvando...
            </>
          ) : (
            <>
              <FileCheck size={18} className="mr-3" />
              Finalizar Solicitacao
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh] border border-slate-200"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                  {showSearch === 'candidatos' ? 'Processo Seletivo' : 'Banco de Especialistas'}
                </h3>
                <button onClick={() => setShowSearch(null)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded text-xs font-medium outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {showSearch === 'candidatos'
                  ? filtrarCandidatos.map((c) => (
                      <button
                        key={c.ref}
                        onClick={() => addMembro(c.ref, c.nome, c.categoria)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded transition-all text-left group cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{c.nome}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {CATEGORIA_BOLSA_LABELS[c.categoria]?.nivel ?? c.categoria}
                          </p>
                        </div>
                        <div className="p-1 px-2 border border-slate-200 text-slate-400 rounded text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                          ADICIONAR
                        </div>
                      </button>
                    ))
                  : filtrarEspecialistas.map((e) => (
                      <button
                        key={e.ref}
                        onClick={() => addMembro(e.ref, e.nome, CategoriaBolsa.PESQUISADOR_PLENO)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded transition-all text-left group cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{e.nome}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {e.ch_atual}h atuais — {e.email}
                          </p>
                        </div>
                        <div className="p-1 px-2 border border-slate-200 text-slate-400 rounded text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                          ADICIONAR
                        </div>
                      </button>
                    ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Solicitacao Salva!</h3>
              <p className="text-slate-500 font-medium mb-8">
                Os membros foram incluidos na solicitacao com sucesso.
              </p>
              <button
                onClick={() => navigate(`/projetos/${projetoId}`)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
              >
                Voltar ao Projeto
                <ArrowLeft size={18} className="rotate-180" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
