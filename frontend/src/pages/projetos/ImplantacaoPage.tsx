import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Users,
  Search,
  FileCheck,
  History,
  X,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { especialistaService, type Especialista } from '@/services/especialistaService';
import { CategoriaBolsa, FonteFinanciamento, TipoSolicitacao } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { cn } from '@/lib/cn';
import { MembroEditor, type MembroLocalProps } from './MembroEditor';
import { KpiFontesBolas } from '@/components/orcamento/KpiFontesBolsas';
import type { Projeto } from '@/types/projeto';

// Mock temporário para Candidatos (Processo Seletivo) - aguardando endpoint AIE
const CANDIDATOS_MOCK = [
  { ref: 'CAND001', nome: 'João Silva', categoria: CategoriaBolsa.PESQUISADOR_JUNIOR },
  { ref: 'CAND002', nome: 'Maria Santos', categoria: CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO },
  { ref: 'CAND003', nome: 'Pedro Oliveira', categoria: CategoriaBolsa.PROFISSIONAL_PLENO },
];

// Tipo de membro em edição na tela (antes de enviar ao backend)
// backendId presente = já persistido; ausente = novo (ainda não enviado)
const formatCurrencyBRL = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

type MembroLocal = MembroLocalProps & { backendId?: number };

interface HistoryLog {
  id: string;
  type: 'ADD' | 'REMOVE' | 'UPDATE';
  nome: string;
  detail: string;
}


export default function ImplantacaoPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null);
  const [membros, setMembros] = useState<MembroLocal[]>([]);
  const [showSearch, setShowSearch] = useState<'candidatos' | 'especialistas' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [justificativa, setJustificativa] = useState('');
  const [justificativaErro, setJustificativaErro] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [buscandoEspecialistas, setBuscandoEspecialistas] = useState(false);
  const [valorPreviewPorTempId, setValorPreviewPorTempId] = useState<Record<string, number | null>>({});

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

        // Apenas resume um rascunho existente. A solicitação SÓ é criada ao clicar em Finalizar.
        const existente = ss.find(
          (s) => s.tipo === TipoSolicitacao.IMPLANTACAO && s.status === 'EM_EDICAO',
        );
        if (existente) {
          setSolicitacaoId(existente.id);
          setJustificativa(existente.justificativa_implantacao ?? '');
          const ms = await solicitacaoService.listarMembros(existente.id);
          setMembros(
            ms.map((m) => ({
              _tempId: String(m.id),
              backendId: m.id,
              ref_pesquisador: m.ref_pesquisador,
              nome_pesquisador: m.nome_pesquisador,
              categoria_bolsa: m.categoria_bolsa,
              fonte_financiamento: m.fonte_financiamento,
              carga_horaria_semanal: m.carga_horaria_semanal,
              data_inicio: m.data_inicio,
              data_fim: m.data_fim,
            })),
          );
        }
      } catch {
        setErro('Não foi possível inicializar a implantação.');
      }
    }
    void init();
  }, [projetoId]);

  // Busca especialistas da API quando abre o modal ou muda o termo de busca
  useEffect(() => {
    if (showSearch !== 'especialistas') return;

    const buscar = async () => {
      setBuscandoEspecialistas(true);
      try {
        const resultado = await especialistaService.buscar(searchTerm || undefined);
        setEspecialistas(resultado);
      } catch {
        setEspecialistas([]);
      } finally {
        setBuscandoEspecialistas(false);
      }
    };

    const debounce = setTimeout(buscar, 300);
    return () => clearTimeout(debounce);
  }, [showSearch, searchTerm]);

  const log = (type: HistoryLog['type'], nome: string, detail: string) =>
    setHistory((prev) => [{ id: Math.random().toString(36).slice(2), type, nome, detail }, ...prev]);

  const addMembro = (ref: string, nome: string, categoria: CategoriaBolsa) => {
    if (membros.some((m) => m.ref_pesquisador === ref)) {
      setModalErro(`O pesquisador ${nome} já está na lista de designação`);
      return;
    }
    const novoMembro: MembroLocal = {
      _tempId: Math.random().toString(36).slice(2),
      ref_pesquisador: ref,
      nome_pesquisador: nome,
      categoria_bolsa: categoria,
      fonte_financiamento:
        projeto?.fontes_financiamento[0]?.fonte ?? FonteFinanciamento.EMPRESA,
      carga_horaria_semanal: 20,
      data_inicio: projeto?.data_inicio ?? '',
      data_fim: projeto?.data_fim,
    };
    setMembros((prev) => [...prev, novoMembro]);
    log('ADD', nome, 'Adicionado à lista de designação');
    setShowSearch(null);
    setSearchTerm('');
  };

  const removeMembro = (tempId: string) => {
    const m = membros.find((x) => x._tempId === tempId);
    if (m) log('REMOVE', m.nome_pesquisador, 'Removido da lista');
    setMembros((prev) => prev.filter((x) => x._tempId !== tempId));
    setValorPreviewPorTempId((prev) => {
      const prox = { ...prev };
      delete prox[tempId];
      return prox;
    });
  };

  const updateMembro = (tempId: string, changes: Partial<MembroLocalProps>) => {
    setMembros((prev) =>
      prev.map((m) => (m._tempId === tempId ? { ...m, ...changes } : m)),
    );
  };

  const updateValorPreview = (tempId: string, valor: number | null) => {
    setValorPreviewPorTempId((prev) => {
      if (prev[tempId] === valor) return prev;
      return { ...prev, [tempId]: valor };
    });
  };

  const temMembrosDesignacao = membros.length > 0;

  const validarDesignacoes = () => {
    if (temMembrosDesignacao) return true;
    setErro('Inclua pelo menos um membro na implantação antes de cadastrar a solicitação.');
    return false;
  };

  const handleFinalizar = async () => {
    if (!validarDesignacoes()) return;
    const justificativaTratada = justificativa.trim();
    if (!justificativaTratada) {
      setJustificativaErro('Informe a justificativa da implantação.');
      return;
    }
    setFinalizando(true);
    setErro(null);
    setJustificativaErro(null);
    try {
      // Cria a solicitação apenas agora (no submit), se ainda não existir rascunho.
      let id = solicitacaoId;
      if (!id) {
        const nova = await solicitacaoService.criar({
          identificador: `IMP-${projetoId}-${Date.now()}`,
          projeto_id: projetoId,
          tipo: TipoSolicitacao.IMPLANTACAO,
          justificativa: justificativaTratada,
        });
        id = nova.id;
        setSolicitacaoId(id);
      } else {
        await solicitacaoService.atualizarJustificativa(id, justificativaTratada);
      }
      // Envia apenas membros novos (sem backendId) — os já persistidos não precisam ser re-enviados
      const novos = membros.filter((m) => !m.backendId);
      for (const m of novos) {
        const { _tempId, backendId, ...dados } = m;
        void _tempId;
        void backendId;
        await solicitacaoService.incluirMembro(id, dados);
      }
      // Submete e aprova diretamente quando o usuário logado é o coordenador do projeto.
      await solicitacaoService.submeter(id);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErro(e?.response?.data?.detail ?? 'Erro ao finalizar solicitação. Tente novamente.');
    } finally {
      setFinalizando(false);
    }
  };

  // Filtra candidatos localmente (mock)
  const filtrarCandidatos = CANDIDATOS_MOCK.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  // Especialistas já vêm filtrados da API pelo useEffect

  const totalFontes = (projeto?.fontes_financiamento ?? []).reduce(
    (acc, fonte) => acc + Number(fonte.valor),
    0,
  );
  const totalCargaHoraria = membros.reduce(
    (acc, membro) => acc + Number(membro.carga_horaria_semanal || 0),
    0,
  );
  const totalBolsas = membros.reduce(
    (acc, membro) => acc + (valorPreviewPorTempId[membro._tempId] ?? membro.valor_bolsa ?? 0),
    0,
  );
  const excedeOrcamento = totalBolsas > totalFontes;
  const fontesDoProjeto = (projeto?.fontes_financiamento ?? []).map((fonte) => fonte.fonte);

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
          <h2 className="text-2xl font-bold text-slate-900">Implantação / Alteração de RH</h2>
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
              Candidatos Aprovados — mock até endpoint AIE
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
              Servidores e Remanejados — API integrada
            </p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Quadro de Membros
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Aguardando finalização
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
              {membros.length} Membros
            </span>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
              {totalCargaHoraria}h Total
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              {formatCurrencyBRL(totalBolsas)}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {membros.map((m) => (
            <motion.div layout key={m._tempId}>
              <MembroEditor
                membro={m}
                onChange={(changes) => updateMembro(m._tempId, changes)}
                onRemove={() => removeMembro(m._tempId)}
                projetoId={projetoId}
                projetoDataInicio={projeto?.data_inicio}
                projetoDataFim={projeto?.data_fim}
                fontesDisponiveis={fontesDoProjeto}
                onValorPreviewChange={(valor) => updateValorPreview(m._tempId, valor)}
              />
            </motion.div>
          ))}

          {membros.length === 0 && (
            <div className="p-24 text-center">
              <Users size={64} className="mx-auto mb-6 text-slate-100" />
              <p className="font-black text-slate-300 uppercase tracking-widest text-xs italic">
                Inclua pelo menos um membro na implantação.
              </p>
              <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Não é permitido cadastrar uma implantação sem membros.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
            Justificativa
          </h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            Obrigatória para submeter a implantação
          </p>
        </div>
        <textarea
          rows={4}
          value={justificativa}
          onChange={(event) => {
            setJustificativa(event.target.value);
            if (justificativaErro) setJustificativaErro(null);
          }}
          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white"
          placeholder="Descreva o motivo da implantação da equipe de RH..."
        />
        {justificativaErro && (
          <p className="text-xs font-medium text-red-600">{justificativaErro}</p>
        )}
      </section>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
            Histórico de Alterações
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
              Nenhum evento nesta sessão
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-slate-100 border border-slate-200 rounded-lg gap-4">
        <KpiFontesBolas
          totalFontes={totalFontes}
          totalBolsas={totalBolsas}
          className="flex-1"
        />
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={!temMembrosDesignacao || finalizando || excedeOrcamento || !justificativa.trim()}
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
              Cadastrar Implantação
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[min(520px,calc(100vh-2rem))] border border-slate-200"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {showSearch === 'candidatos' ? 'Processo seletivo' : 'Banco de Especialistas'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Selecionar pesquisador
                  </p>
                </div>
                <button
                  onClick={() => { setShowSearch(null); setModalErro(null); }}
                  className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>
              {modalErro && (
                <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>{modalErro}</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {showSearch === 'candidatos'
                  ? filtrarCandidatos.map((c) => (
                      <button
                        key={c.ref}
                        onClick={() => addMembro(c.ref, c.nome, c.categoria)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-all text-left group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                          {c.nome.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{c.nome}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {CATEGORIA_BOLSA_LABELS[c.categoria]?.nivel ?? c.categoria}
                          </p>
                        </div>
                        <div className="px-2 py-1 border border-slate-200 text-slate-400 rounded-md text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                          ADICIONAR
                        </div>
                      </button>
                    ))
                  : buscandoEspecialistas ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mx-auto mb-2"></div>
                        <p className="text-xs text-slate-400 font-medium">Buscando especialistas...</p>
                      </div>
                    ) : especialistas.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium">
                        {searchTerm ? 'Nenhum especialista encontrado.' : 'Digite para buscar especialistas.'}
                      </div>
                    ) : (
                      especialistas.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => addMembro(e.matricula, e.nome, CategoriaBolsa.PESQUISADOR_PLENO)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-all text-left group cursor-pointer"
                        >
                          <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                            {e.nome.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-sm truncate">{e.nome}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Matrícula: {e.matricula}
                            </p>
                          </div>
                          <div className="px-2 py-1 border border-slate-200 text-slate-400 rounded-md text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                            ADICIONAR
                          </div>
                        </button>
                      ))
                    )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
                  <FileCheck size={20} />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-base font-bold text-slate-900">Cadastrar implantação</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    A solicitação será criada e aprovada diretamente com os membros informados.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Membros</p>
                  <p className="text-sm font-bold text-slate-900">{membros.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Carga</p>
                  <p className="text-sm font-bold text-slate-900">{totalCargaHoraria}h</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bolsas</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrencyBRL(totalBolsas)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={finalizando}
                  className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    void handleFinalizar();
                  }}
                  disabled={finalizando}
                  className="py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {finalizando ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 shrink-0">
                  <FileCheck size={20} />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-base font-bold text-slate-900">Implantação aprovada</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Solicitação #{solicitacaoId}. A equipe informada já está vigente no projeto.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button
                  onClick={() => navigate(`/solicitacoes/${solicitacaoId}/comparacao`)}
                  className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
                >
                  <FileCheck size={14} />
                  Ver Solicitação
                </button>
                <button
                  onClick={() => navigate(`/projetos/${projetoId}`)}
                  className="py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
                >
                  Voltar ao Projeto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
