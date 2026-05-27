import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  GitCompare,
  Save,
  AlertCircle,
  Users,
  Search,
  UserPlus,
  X,
  CheckCircle2,
  History,
  FileCheck,
} from 'lucide-react';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { CategoriaBolsa, FonteFinanciamento, TipoSolicitacao, FONTE_LABELS } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import { MembroEditor, type MembroLocalProps } from './MembroEditor';
import { cn } from '@/lib/cn';
import type { Projeto, VersaoRHProjeto } from '@/types/projeto';
import type { Membro } from '@/types/solicitacao';

interface HistoryLog {
  id: string;
  type: 'ADD' | 'REMOVE' | 'UPDATE';
  nome: string;
  detail: string;
}

// Mocks mantidos até existir endpoint do Banco de Especialistas
const CANDIDATOS_MOCK = [
  { ref: 'CAND-001', nome: 'Lucas Amado', categoria: CategoriaBolsa.PESQUISADOR_MASTER },
  { ref: 'CAND-002', nome: 'Carla Dias', categoria: CategoriaBolsa.PESQUISADOR_PLENO },
  { ref: 'CAND-003', nome: 'Bernardo Silva', categoria: CategoriaBolsa.PESQUISADOR_JUNIOR },
];
const ESPECIALISTAS_MOCK = [
  { ref: 'ESP-001', nome: 'João Silva', email: 'joao.silva@if.edu.br' },
  { ref: 'ESP-002', nome: 'Maria Souza', email: 'maria.souza@if.edu.br' },
  { ref: 'ESP-003', nome: 'Pedro Oliver', email: 'pedro.oliver@ext.com' },
];

function membroToLocal(m: Membro): MembroLocalProps {
  return {
    _tempId: `existente-${m.id}`,
    id: m.id,
    ref_pesquisador: m.ref_pesquisador,
    nome_pesquisador: m.nome_pesquisador,
    categoria_bolsa: m.categoria_bolsa,
    fonte_financiamento: m.fonte_financiamento,
    carga_horaria_semanal: m.carga_horaria_semanal,
    data_inicio: m.data_inicio,
    data_fim: m.data_fim,
    valor_bolsa: m.valor_bolsa,
  };
}

export default function AlteracaoPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();
  const projetoId = Number(id_projeto);

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null);
  const [versaoVigente, setVersaoVigente] = useState<VersaoRHProjeto | null>(null);
  const [equipeAtual, setEquipeAtual] = useState<Membro[]>([]);
  const [equipeProposta, setEquipeProposta] = useState<MembroLocalProps[]>([]);
  const [idsExistentesOriginais, setIdsExistentesOriginais] = useState<Set<number>>(new Set());
  const [idsRemovidos, setIdsRemovidos] = useState<Set<number>>(new Set());

  const [showSearch, setShowSearch] = useState<'candidatos' | 'especialistas' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSubmetidaModal, setShowSubmetidaModal] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!projetoId) return;

    async function init() {
      try {
        const [p, versoes, ss] = await Promise.all([
          projetoService.obter(projetoId),
          projetoService.listarVersoes(projetoId),
          solicitacaoService.listar(projetoId),
        ]);
        setProjeto(p);

        const vigente = versoes.find((v) => v.status === 'VIGENTE');
        if (!vigente) {
          setErro('Este projeto ainda não possui versão vigente. Use Implantação Inicial.');
          setCarregando(false);
          return;
        }
        setVersaoVigente(vigente);

        // Equipe atual (somente leitura) — membros da versão vigente.
        // Buscar via solicitacao_id que originou essa versão.
        if (vigente.solicitacao_id) {
          const membrosVigentes = await solicitacaoService.listarMembros(vigente.solicitacao_id);
          setEquipeAtual(membrosVigentes);
        }

        // Apenas resume um rascunho existente. A solicitação só é criada ao Salvar/Submeter.
        const existente = ss.find(
          (s) => s.tipo === TipoSolicitacao.ALTERACAO && s.status === 'EM_EDICAO',
        );
        if (existente) {
          setSolicitacaoId(existente.id);
          const propostos = await solicitacaoService.listarMembros(existente.id);
          const locais = propostos.map(membroToLocal);
          setEquipeProposta(locais);
          setIdsExistentesOriginais(new Set(propostos.map((m) => m.id)));
        } else {
          // Inicializa a equipe proposta como copia da vigente (apenas em memoria,
          // sem persistir). O backend clona oficialmente quando a solicitação for criada.
          if (vigente.solicitacao_id) {
            const membrosVigentes = await solicitacaoService.listarMembros(vigente.solicitacao_id);
            const locais = membrosVigentes.map((m) => ({
              _tempId: `vigente-preview-${m.id}`,
              ref_pesquisador: m.ref_pesquisador,
              nome_pesquisador: m.nome_pesquisador,
              categoria_bolsa: m.categoria_bolsa,
              fonte_financiamento: m.fonte_financiamento,
              carga_horaria_semanal: m.carga_horaria_semanal,
              data_inicio: m.data_inicio,
              data_fim: m.data_fim,
            }));
            setEquipeProposta(locais);
          }
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { detail?: string } } };
        setErro(e?.response?.data?.detail ?? 'Não foi possível inicializar a alteração.');
      } finally {
        setCarregando(false);
      }
    }
    void init();
  }, [projetoId]);

  const log = (type: HistoryLog['type'], nome: string, detail: string) =>
    setHistory((prev) => [{ id: Math.random().toString(36).slice(2), type, nome, detail }, ...prev]);

  const addMembro = (ref: string, nome: string, categoria: CategoriaBolsa) => {
    if (equipeProposta.some((m) => m.ref_pesquisador === ref)) {
      setModalErro(`O pesquisador ${nome} já está na equipe proposta`);
      return;
    }
    setEquipeProposta((prev) => [
      ...prev,
      {
        _tempId: `novo-${Math.random().toString(36).slice(2)}`,
        ref_pesquisador: ref,
        nome_pesquisador: nome,
        categoria_bolsa: categoria,
        fonte_financiamento: FonteFinanciamento.EMPRESA,
        carga_horaria_semanal: 20,
        data_inicio: projeto?.data_inicio ?? '',
        data_fim: projeto?.data_fim,
      },
    ]);
    log('ADD', nome, 'Adicionado à equipe proposta');
    setShowSearch(null);
    setSearchTerm('');
  };

  const removeMembro = (tempId: string) => {
    const m = equipeProposta.find((x) => x._tempId === tempId);
    if (!m) return;
    if (m.id) setIdsRemovidos((s) => new Set(s).add(m.id!));
    log('REMOVE', m.nome_pesquisador, m.id ? 'Marcado para encerramento' : 'Removido da lista');
    setEquipeProposta((prev) => prev.filter((x) => x._tempId !== tempId));
  };

  const updateMembro = (tempId: string, changes: Partial<MembroLocalProps>) => {
    setEquipeProposta((prev) =>
      prev.map((m) => (m._tempId === tempId ? { ...m, ...changes } : m)),
    );
  };

  const garantirSolicitacao = async (): Promise<{
    solicitacaoId: number;
    membrosMapeados: MembroLocalProps[];
  }> => {
    if (solicitacaoId) {
      return { solicitacaoId, membrosMapeados: equipeProposta };
    }
    const nova = await solicitacaoService.criar({
      identificador: `ALT-${projetoId}-${Date.now()}`,
      projeto_id: projetoId,
      tipo: TipoSolicitacao.ALTERACAO,
    });
    setSolicitacaoId(nova.id);

    // Backend acabou de clonar a vigente. Sincroniza ids para diferenciar
    // existentes (clonados) das adições feitas na sessão.
    const clonados = await solicitacaoService.listarMembros(nova.id);
    const mapaPorRef = new Map(clonados.map((c) => [c.ref_pesquisador, c]));
    const idsOriginais = new Set(clonados.map((c) => c.id));
    const membrosMapeados: MembroLocalProps[] = equipeProposta.map((m) => {
      if (m.id) return m;
      const clone = mapaPorRef.get(m.ref_pesquisador);
      return clone ? { ...m, id: clone.id, _tempId: `existente-${clone.id}` } : m;
    });
    setEquipeProposta(membrosMapeados);
    setIdsExistentesOriginais(idsOriginais);
    return { solicitacaoId: nova.id, membrosMapeados };
  };

  const persistirMudancas = async (
    id_solicitacao: number,
    membros: MembroLocalProps[],
    idsARemover: Set<number>,
    idsOriginais: Set<number>,
  ) => {
    // 1) Inclusões (membros novos)
    for (const m of membros.filter((x) => !x.id)) {
      const { _tempId, id, ...dados } = m;
      void _tempId;
      void id;
      await solicitacaoService.incluirMembro(id_solicitacao, dados);
    }

    // 2) Alterações (membros existentes que estão na lista)
    for (const m of membros.filter((x) => !!x.id)) {
      const { _tempId, id, ...dados } = m;
      void _tempId;
      await solicitacaoService.atualizarMembro(id_solicitacao, id!, dados);
    }

    // 3) Encerramentos (existentes que foram removidos da lista)
    for (const id of idsARemover) {
      if (idsOriginais.has(id)) {
        await solicitacaoService.encerrarMembro(id_solicitacao, id, 'Encerrado na alteração');
      }
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro(null);

    try {
      const { solicitacaoId: id, membrosMapeados } = await garantirSolicitacao();
      await persistirMudancas(id, membrosMapeados, idsRemovidos, idsExistentesOriginais);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErro(e?.response?.data?.detail ?? 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmeter = async () => {
    setSubmetendo(true);
    setErro(null);

    try {
      const { solicitacaoId: id, membrosMapeados } = await garantirSolicitacao();
      await persistirMudancas(id, membrosMapeados, idsRemovidos, idsExistentesOriginais);
      await solicitacaoService.submeter(id);
      setShowSubmetidaModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErro(e?.response?.data?.detail ?? 'Erro ao submeter alteração. Tente novamente.');
    } finally {
      setSubmetendo(false);
    }
  };

  const filtrarCandidatos = CANDIDATOS_MOCK.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filtrarEspecialistas = ESPECIALISTAS_MOCK.filter((e) =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Carregando dados da alteração...</p>
      </div>
    );
  }

  if (erro && !solicitacaoId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(`/projetos/${projetoId}`)}
          className="flex items-center text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-widest gap-1 cursor-pointer"
        >
          <ArrowLeft size={14} /> Voltar ao Projeto
        </button>
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <button
          onClick={() => navigate(`/projetos/${projetoId}`)}
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar ao Projeto
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-900">Alteração de RH</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Projeto: <span className="text-slate-900">{projeto?.codigo}</span>
            {versaoVigente && (
              <span className="ml-3">
                Versão vigente: v{versaoVigente.numero_versao}
              </span>
            )}
          </p>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Equipe Atual (somente leitura) */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Equipe Atual (Antes)
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Versão vigente — somente leitura
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
              {equipeAtual.length} membros
            </span>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
              {equipeAtual.reduce((acc, m) => acc + m.carga_horaria_semanal, 0)}h total
            </span>            
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Total: R$ {equipeAtual.reduce((acc, m) => acc + Number(m.valor_bolsa), 0).toLocaleString('pt-BR')}
            </span>            
          </div>
        </div>
        {equipeAtual.length === 0 ? (
          <p className="p-8 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
            Sem membros na versão vigente
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Pesquisador</th>
                <th className="py-3">Categoria</th>
                <th className="py-3 text-center">CH</th>
                <th className="py-3">Fonte</th>
                <th className="py-3 text-right px-6">Bolsa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipeAtual.map((m) => (
                <tr key={m.id} className="text-sm">
                  <td className="px-6 py-3 font-bold text-slate-900">{m.nome_pesquisador}</td>
                  <td className="py-3 text-xs text-slate-700">
                    {CATEGORIA_BOLSA_LABELS[m.categoria_bolsa]?.nivel ?? m.categoria_bolsa}
                  </td>
                  <td className="py-3 text-center text-xs">{m.carga_horaria_semanal}h</td>
                  <td className="py-3 text-xs">{FONTE_LABELS[m.fonte_financiamento]}</td>
                  <td className="py-3 text-right px-6 font-bold">
                    R$ {Number(m.valor_bolsa).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Equipe Proposta (editavel) */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Equipe Proposta (Depois)
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Edite, adicione ou encerre membros
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
              {equipeProposta.length} membros
            </span>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
              {equipeProposta.reduce((acc, m) => acc + m.carga_horaria_semanal, 0)}h total
            </span>            
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Total: R$ {equipeProposta.reduce((acc, m) => acc + (m.valor_bolsa ?? 0), 0).toLocaleString('pt-BR')}
            </span>            
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-slate-200 bg-slate-50/30">
          <button
            onClick={() => setShowSearch('candidatos')}
            className="flex items-center p-3 bg-white border border-slate-200 rounded hover:border-slate-400 transition-all cursor-pointer"
          >
            <div className="p-2 bg-slate-100 text-slate-600 rounded mr-3">
              <Users size={16} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-xs">Adicionar via Processo Seletivo</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Candidatos aprovados</p>
            </div>
          </button>
          <button
            onClick={() => setShowSearch('especialistas')}
            className="flex items-center p-3 bg-white border border-slate-200 rounded hover:border-slate-400 transition-all cursor-pointer"
          >
            <div className="p-2 bg-slate-900 text-white rounded mr-3">
              <UserPlus size={16} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-xs">Adicionar via Banco de Especialistas</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Servidores e remanejados</p>
            </div>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {equipeProposta.map((m) => (
            <motion.div layout key={m._tempId}>
              {m.id && (
                <p className="px-6 pt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Membro existente (id: {m.id})
                </p>
              )}
              {!m.id && (
                <p className="px-6 pt-3 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                  Novo membro
                </p>
              )}
              <MembroEditor
                membro={m}
                onChange={(changes) => updateMembro(m._tempId, changes)}
                onRemove={() => removeMembro(m._tempId)}
                projetoId={projetoId}
              />
            </motion.div>
          ))}

          {equipeProposta.length === 0 && (
            <div className="p-16 text-center">
              <Users size={48} className="mx-auto mb-4 text-slate-100" />
              <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">
                Sem membros na proposta
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Historico da sessao */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <History size={14} className="text-slate-600" />
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Histórico desta sessão
          </h4>
          <span className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {history.length} eventos
          </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
          {history.length === 0 && (
            <p className="p-6 text-center text-slate-300 uppercase tracking-widest font-bold text-[10px]">
              Nenhum evento ainda
            </p>
          )}
          {history.map((log) => (
            <div key={log.id} className="p-3 flex items-center gap-3 hover:bg-slate-50/30">
              <div
                className={cn(
                  'w-10 h-10 rounded flex items-center justify-center font-bold text-[10px]',
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
                <p className="text-[10px] text-slate-500 font-medium">{log.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ações */}
      <div className="flex items-center justify-between p-6 bg-slate-100 border border-slate-200 rounded-lg">
        {solicitacaoId ? (
          <Link
            to={`/solicitacoes/${solicitacaoId}/comparacao`}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
          >
            <GitCompare size={14} className="mr-2" />
            Ver Comparação
          </Link>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Salve o rascunho para ver a comparação
          </span>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSalvar}
            disabled={salvando || submetendo}
            className="flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-30 shadow-sm active:scale-95 cursor-pointer"
          >
            {salvando ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-700 mr-3"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Salvar Rascunho
              </>
            )}
          </button>
          <button
            onClick={handleSubmeter}
            disabled={salvando || submetendo}
            className="flex items-center px-8 py-3 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-30 shadow-sm active:scale-95 cursor-pointer"
          >
            {submetendo ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-3"></div>
                Submetendo...
              </>
            ) : (
              <>
                <FileCheck size={16} className="mr-2" />
                Submeter Solicitação
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de busca */}
      {showSearch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh] border border-slate-200"
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                {showSearch === 'candidatos' ? 'Processo Seletivo' : 'Banco de Especialistas'}
              </h3>
              <button
                onClick={() => { setShowSearch(null); setModalErro(null); }}
                className="p-2 hover:bg-slate-100 rounded-full cursor-pointer"
              >
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
            {modalErro && (
              <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{modalErro}</span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {showSearch === 'candidatos'
                ? filtrarCandidatos.map((c) => (
                    <button
                      key={c.ref}
                      onClick={() => addMembro(c.ref, c.nome, c.categoria)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded text-left cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.nome}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {CATEGORIA_BOLSA_LABELS[c.categoria]?.nivel ?? c.categoria}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded">
                        ADICIONAR
                      </span>
                    </button>
                  ))
                : filtrarEspecialistas.map((e) => (
                    <button
                      key={e.ref}
                      onClick={() => addMembro(e.ref, e.nome, CategoriaBolsa.PESQUISADOR_PLENO)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded text-left cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{e.nome}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {e.email}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded">
                        ADICIONAR
                      </span>
                    </button>
                  ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de sucesso (rascunho salvo) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Rascunho Salvo!</h3>
            <p className="text-slate-500 font-medium mb-6">
              Suas mudanças foram salvas. A alteração continua em edição até ser submetida.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/solicitacoes/${solicitacaoId}/comparacao`}
                className="py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                <GitCompare size={14} />
                Comparar
              </Link>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de submissão final */}
      {showSubmetidaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Alteração Submetida!</h3>
            <p className="text-slate-500 font-medium mb-6">
              A nova versão agora é a vigente do projeto. A versão anterior foi para o histórico.
            </p>
            <button
              onClick={() => navigate(`/projetos/${projetoId}`)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
            >
              <ArrowLeft size={14} />
              Voltar ao Projeto
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
