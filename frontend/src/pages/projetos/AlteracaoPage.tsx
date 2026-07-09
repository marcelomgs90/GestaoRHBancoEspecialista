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
import { especialistaService, type Especialista } from '@/services/especialistaService';
import {
  CategoriaBolsa,
  FonteFinanciamento,
  TipoSolicitacao,
  FONTE_LABELS,
  FONTES_RH_OPERACIONAIS,
} from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS, formatDate } from '@/types/projeto';
import { MembroEditor, type MembroLocalProps } from './MembroEditor';
import { KpiFontesBolas } from '@/components/orcamento/KpiFontesBolsas';
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

/**
 * Compara o estado local de um membro com o clone original no backend.
 * Só os campos que o usuário pode editar entram na comparação.
 *
 * `valor_bolsa` é derivado (calculado pelo `parametroService`); não conta
 * como mudança do usuário — se o `MembroEditor` recalcular e o valor mudar
 * mas os inputs forem os mesmos, NÃO devemos disparar PUT.
 */
function membroMudou(local: MembroLocalProps, clone: Membro): boolean {
  if (local.categoria_bolsa !== clone.categoria_bolsa) return true;
  if (local.fonte_financiamento !== clone.fonte_financiamento) return true;
  if (local.carga_horaria_semanal !== clone.carga_horaria_semanal) return true;
  if ((local.data_inicio ?? '') !== clone.data_inicio) return true;
  if ((local.data_fim ?? null) !== (clone.data_fim ?? null)) return true;
  return false;
}

const formatCurrencyBRL = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

export default function AlteracaoPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();
  const projetoId = Number(id_projeto);

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null);
  const [versaoVigente, setVersaoVigente] = useState<VersaoRHProjeto | null>(null);
  const [equipeAtual, setEquipeAtual] = useState<Membro[]>([]);
  const [equipeProposta, setEquipeProposta] = useState<MembroLocalProps[]>([]);

  const [showSearch, setShowSearch] = useState<'candidatos' | 'especialistas' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [buscandoEspecialistas, setBuscandoEspecialistas] = useState(false);
  const [valorPreviewPorTempId, setValorPreviewPorTempId] = useState<Record<string, number | null>>({});
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [justificativa, setJustificativa] = useState('');
  const [justificativaErro, setJustificativaErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAprovadaModal, setShowAprovadaModal] = useState(false);
  const [aprovadaSolicitacaoId, setAprovadaSolicitacaoId] = useState<number | null>(null);
  const [membroSaidaPendente, setMembroSaidaPendente] = useState<MembroLocalProps | null>(null);
  const [dataSaida, setDataSaida] = useState('');
  const [erroDataSaida, setErroDataSaida] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [modalErro, setModalErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!projetoId) return;

    async function init() {
      try {
        const [p, versoes, ss, paginacaoVigentes] = await Promise.all([
          projetoService.obter(projetoId),
          projetoService.listarVersoes(projetoId),
          solicitacaoService.listar(projetoId),
          projetoService.listarPesquisadoresVigentes(projetoId, { per_page: 100 }),
        ]);
        setProjeto(p);

        const vigente = versoes.find((v) => v.status === 'VIGENTE');
        if (!vigente) {
          setErro('Este projeto ainda não possui versão vigente. Use Implantação Inicial.');
          setCarregando(false);
          return;
        }
        setVersaoVigente(vigente);

        // Equipe Atual (Antes) — sempre a VIGENTE real, nunca a PROPOSTA em rascunho.
        setEquipeAtual(paginacaoVigentes.items);

        // Apenas resume um rascunho existente. A solicitação só é criada ao Salvar/Submeter.
        const existente = ss.find(
          (s) => s.tipo === TipoSolicitacao.ALTERACAO && s.status === 'EM_EDICAO',
        );
        if (existente) {
          setSolicitacaoId(existente.id);
          setJustificativa(existente.justificativa_alteracao ?? '');
          const propostos = await solicitacaoService.listarMembros(existente.id);
          const locais = propostos.map(membroToLocal);
          setEquipeProposta(locais);
        } else {
          // Preview em memória da VIGENTE (não persistido).
          // Atribuímos o `id` real do membro na VIGENTE para que `removeMembro`
          // identifique o que precisa ser encerrado quando o backend clonar.
          const locais = paginacaoVigentes.items.map((m) => ({
            _tempId: `vigente-preview-${m.id}`,
            id: m.id,
            ref_pesquisador: m.ref_pesquisador,
            nome_pesquisador: m.nome_pesquisador,
            categoria_bolsa: m.categoria_bolsa,
            fonte_financiamento: m.fonte_financiamento,
            carga_horaria_semanal: m.carga_horaria_semanal,
            data_inicio: m.data_inicio,
            data_fim: m.data_fim,
            valor_bolsa: m.valor_bolsa,
          }));
          setEquipeProposta(locais);
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

    const debounce = window.setTimeout(buscar, 300);
    return () => window.clearTimeout(debounce);
  }, [showSearch, searchTerm]);

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
        fonte_financiamento: fontesDoProjeto[0] ?? FonteFinanciamento.EMPRESA,
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

    if (m.id) {
      setMembroSaidaPendente(m);
      setDataSaida(m.data_fim ?? '');
      setErroDataSaida(null);
      return;
    }

    log('REMOVE', m.nome_pesquisador, 'Removido da lista');
    setEquipeProposta((prev) => prev.filter((x) => x._tempId !== tempId));
    setValorPreviewPorTempId((prev) => {
      const prox = { ...prev };
      delete prox[tempId];
      return prox;
    });
  };

  const fecharModalSaida = () => {
    setMembroSaidaPendente(null);
    setDataSaida('');
    setErroDataSaida(null);
  };

  const confirmarSaidaMembro = () => {
    if (!membroSaidaPendente) return;

    if (!dataSaida) {
      setErroDataSaida('Informe a data de saída do projeto.');
      return;
    }

    if (membroSaidaPendente.data_inicio && dataSaida < membroSaidaPendente.data_inicio) {
      setErroDataSaida('A data de saída não pode ser anterior ao início do membro.');
      return;
    }

    if (projeto?.data_fim && dataSaida > projeto.data_fim) {
      setErroDataSaida('A data de saída não pode passar do fim do projeto.');
      return;
    }

    setEquipeProposta((prev) =>
      prev.map((m) =>
        m._tempId === membroSaidaPendente._tempId ? { ...m, data_fim: dataSaida } : m,
      ),
    );
    setValorPreviewPorTempId((prev) => {
      const prox = { ...prev };
      delete prox[membroSaidaPendente._tempId];
      return prox;
    });
    log('REMOVE', membroSaidaPendente.nome_pesquisador, `Saída em ${formatDate(dataSaida)}`);
    fecharModalSaida();
  };

  const updateMembro = (tempId: string, changes: Partial<MembroLocalProps>) => {
    setEquipeProposta((prev) =>
      prev.map((m) => (m._tempId === tempId ? { ...m, ...changes } : m)),
    );
  };

  const updateValorPreview = (tempId: string, valor: number | null) => {
    setValorPreviewPorTempId((prev) => {
      if (prev[tempId] === valor) return prev;
      return { ...prev, [tempId]: valor };
    });
  };

  const valorMembro = (membro: MembroLocalProps) =>
    valorPreviewPorTempId[membro._tempId] ?? membro.valor_bolsa ?? 0;

  const totalEquipeAtual = equipeAtual.reduce((acc, m) => acc + Number(m.valor_bolsa), 0);
  const totalEquipeProposta = equipeProposta.reduce((acc, m) => acc + valorMembro(m), 0);
  const totalFontes = (projeto?.fontes_financiamento ?? []).reduce(
    (acc, fonte) => acc + Number(fonte.valor),
    0,
  );
  const excedeOrcamento = totalEquipeProposta > totalFontes;
  const fontesDoProjeto = (projeto?.fontes_financiamento ?? [])
    .map((fonte) => fonte.fonte)
    .filter((fonte) => FONTES_RH_OPERACIONAIS.includes(fonte));
  const temMembrosProposta = equipeProposta.length > 0;
  const encerramentosPlanejados = equipeProposta.filter((m) => {
    if (!m.id || !m.data_fim) return false;
    const atual = equipeAtual.find((a) => a.ref_pesquisador === m.ref_pesquisador);
    return atual ? (atual.data_fim ?? null) !== m.data_fim : false;
  });

  const validarEquipeProposta = () => {
    if (temMembrosProposta) return true;
    setErro('Inclua pelo menos um membro na equipe proposta antes de salvar ou submeter a alteração.');
    return false;
  };

  /**
   * Garante que a solicitação existe e retorna o estado consistente dos clones.
   *
   * Importante: a closure do React não enxerga o `setState` aplicado em
   * `equipeProposta` no mesmo tick. Por isso retornamos `mapaRefParaIdClonado`
   * e `estadoOriginalClones` calculados a partir da resposta do backend.
   *
   * Retorna:
   * - `mapaRefParaIdClonado`: ref_pesquisador → id do clone na PROPOSTA.
   *   Usado para associar membros da preview aos clones criados pelo backend.
   * - `estadoOriginalClones`: id do clone → Membro como estava no clone.
   *   Usado para detectar mudanças reais e evitar PUTs parasitas.
   */
  const garantirSolicitacao = async (): Promise<{
    solicitacaoId: number;
    membrosMapeados: MembroLocalProps[];
    mapaRefParaIdClonado: Map<string, number>;
    estadoOriginalClones: Map<number, Membro>;
  }> => {
    const justificativaTratada = justificativa.trim();
    if (!justificativaTratada) {
      setJustificativaErro('Informe a justificativa da alteração.');
      throw new Error('Informe a justificativa da alteração.');
    }
    setJustificativaErro(null);

    if (solicitacaoId) {
      await solicitacaoService.atualizarJustificativa(solicitacaoId, justificativaTratada);
      // Solicitação já existe: revalidar o estado dos clones a cada salvamento.
      const propostos = await solicitacaoService.listarMembros(solicitacaoId);
      const mapaRefParaIdClonado = new Map(
        propostos.map((m) => [m.ref_pesquisador, m.id]),
      );
      const estadoOriginalClones = new Map(propostos.map((m) => [m.id, m]));
      return {
        solicitacaoId,
        membrosMapeados: equipeProposta,
        mapaRefParaIdClonado,
        estadoOriginalClones,
      };
    }

    const nova = await solicitacaoService.criar({
      identificador: `ALT-${projetoId}-${Date.now()}`,
      projeto_id: projetoId,
      tipo: TipoSolicitacao.ALTERACAO,
      justificativa: justificativaTratada,
    });
    setSolicitacaoId(nova.id);

    // Backend acabou de clonar a vigente. Sincroniza ids para diferenciar
    // existentes (clonados) das adições feitas na sessão.
    const clonados = await solicitacaoService.listarMembros(nova.id);
    const mapaRefParaIdClonado = new Map(
      clonados.map((c) => [c.ref_pesquisador, c.id]),
    );
    const estadoOriginalClones = new Map(clonados.map((c) => [c.id, c]));
    const membrosMapeados: MembroLocalProps[] = equipeProposta.map((m) => {
      if (m.id) {
        // Membro do preview da VIGENTE — mantém o _tempId, apenas associa o id clonado.
        return mapaRefParaIdClonado.has(m.ref_pesquisador)
          ? { ...m, id: mapaRefParaIdClonado.get(m.ref_pesquisador)! }
          : m;
      }
      const cloneId = mapaRefParaIdClonado.get(m.ref_pesquisador);
      return cloneId ? { ...m, id: cloneId, _tempId: `existente-${cloneId}` } : m;
    });
    setEquipeProposta(membrosMapeados);
    return { solicitacaoId: nova.id, membrosMapeados, mapaRefParaIdClonado, estadoOriginalClones };
  };

  /**
   * Persiste as mudanças da alteração no backend.
   *
   * @param mapaRefParaIdClonado mapeia ref_pesquisador → id do clone na PROPOSTA.
   *   Necessário para que atualizações usem o id do clone, não o da VIGENTE.
   * @param estadoOriginalClones estado original dos clones (id → Membro).
   *   Usado para detectar mudanças reais antes do PUT, evitando atualizações
   *   parasitas disparadas pelo recálculo automático de `valor_bolsa` no
   *   `MembroEditor`.
   */
  const persistirMudancas = async (
    id_solicitacao: number,
    membros: MembroLocalProps[],
    mapaRefParaIdClonado: Map<string, number>,
    estadoOriginalClones: Map<number, Membro>,
  ) => {
    const membrosNormalizados = membros.map((m) => {
      if (m.id) return m;
      const cloneId = mapaRefParaIdClonado.get(m.ref_pesquisador);
      return cloneId ? { ...m, id: cloneId, _tempId: `existente-${cloneId}` } : m;
    });

    // 1) Inclusões (membros novos, sem id do clone).
    //    Payload alinhado com o schema `MembroCreate` do backend.
    for (const m of membrosNormalizados.filter((x) => !x.id)) {
      const dadosCreate = {
        ref_pesquisador: m.ref_pesquisador,
        nome_pesquisador: m.nome_pesquisador,
        categoria_bolsa: m.categoria_bolsa,
        fonte_financiamento: m.fonte_financiamento,
        carga_horaria_semanal: m.carga_horaria_semanal,
        data_inicio: m.data_inicio,
        ...(m.data_fim ? { data_fim: m.data_fim } : {}),
        ...(m.origem_rh ? { origem_rh: m.origem_rh } : {}),
      };
      await solicitacaoService.incluirMembro(id_solicitacao, dadosCreate);
    }

    // 2) Alterações (membros com id) — só PUT se houve mudança real vs clone.
    //    Payload alinhado com o schema `MembroUpdate` do backend (apenas os
    //    5 campos editáveis). O backend rejeita (extra="forbid") qualquer
    //    campo extra como `ref_pesquisador`, `nome_pesquisador`, `id` ou
    //    `valor_bolsa` — o `valor_bolsa` é sempre recalculado a partir de
    //    `categoria_bolsa`/`carga_horaria_semanal`/`data_inicio`.
    for (const m of membrosNormalizados.filter((x) => !!x.id)) {
      const clone = estadoOriginalClones.get(m.id!);
      if (!clone) continue;
      if (membroMudou(m, clone)) {
        const dadosUpdate: {
          categoria_bolsa: CategoriaBolsa;
          fonte_financiamento: FonteFinanciamento;
          carga_horaria_semanal: number;
          data_inicio: string;
          data_fim?: string;
        } = {
          categoria_bolsa: m.categoria_bolsa,
          fonte_financiamento: m.fonte_financiamento,
          carga_horaria_semanal: m.carga_horaria_semanal,
          data_inicio: m.data_inicio,
        };
        if (m.data_fim) dadosUpdate.data_fim = m.data_fim;
        await solicitacaoService.atualizarMembro(id_solicitacao, m.id!, dadosUpdate);
      }
    }

  };

  const handleSalvar = async () => {
    if (!validarEquipeProposta()) return;
    setSalvando(true);
    setErro(null);

    try {
      const { solicitacaoId: id, membrosMapeados, mapaRefParaIdClonado, estadoOriginalClones } =
        await garantirSolicitacao();
      await persistirMudancas(id, membrosMapeados, mapaRefParaIdClonado, estadoOriginalClones);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErro(
        e?.response?.data?.detail ??
          (err instanceof Error && !justificativaErro ? err.message : 'Erro ao salvar alterações. Tente novamente.'),
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmeter = async () => {
    if (!validarEquipeProposta()) return;
    setSubmetendo(true);
    setErro(null);

    try {
      const { solicitacaoId: id, membrosMapeados, mapaRefParaIdClonado, estadoOriginalClones } =
        await garantirSolicitacao();
      await persistirMudancas(id, membrosMapeados, mapaRefParaIdClonado, estadoOriginalClones);
      await solicitacaoService.submeter(id);
      setAprovadaSolicitacaoId(id);
      setShowAprovadaModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErro(
        e?.response?.data?.detail ??
          (err instanceof Error && !justificativaErro ? err.message : 'Erro ao submeter alteração. Tente novamente.'),
      );
    } finally {
      setSubmetendo(false);
    }
  };

  const filtrarCandidatos = CANDIDATOS_MOCK.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
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

      {/* Banner: coordenador aprova diretamente ao submeter */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px]">
            Aprovação direta pelo coordenador
          </p>
          <p className="text-xs mt-1">
            Ao submeter, inclusões, alterações e encerramentos serão aplicados
            diretamente à versão vigente do projeto.
          </p>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Equipe Atual (somente leitura) — sempre a VIGENTE real */}
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
              Total: {formatCurrencyBRL(totalEquipeAtual)}
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
                    {formatCurrencyBRL(Number(m.valor_bolsa))}
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
            {encerramentosPlanejados.length > 0 && (
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest bg-red-50 px-2 py-1 rounded border border-red-200">
                {encerramentosPlanejados.length} com saída
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
              {equipeProposta.reduce((acc, m) => acc + m.carga_horaria_semanal, 0)}h total
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Total: {formatCurrencyBRL(totalEquipeProposta)}
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
                removeLabel={m.id ? 'Informar data de saída do membro' : 'Remover membro'}
                projetoId={projetoId}
                projetoDataInicio={projeto?.data_inicio}
                projetoDataFim={projeto?.data_fim}
                fontesDisponiveis={fontesDoProjeto}
                onValorPreviewChange={(valor) => updateValorPreview(m._tempId, valor)}
              />
            </motion.div>
          ))}

          {equipeProposta.length === 0 && equipeAtual.length === 0 && (
            <div className="p-16 text-center">
              <Users size={48} className="mx-auto mb-4 text-slate-100" />
              <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">
                Sem membros na proposta
              </p>
            </div>
          )}

          {equipeProposta.length === 0 && equipeAtual.length > 0 && (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Inclua pelo menos um membro na equipe proposta.
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                Não é permitido salvar ou submeter uma alteração sem membros.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
            Justificativa
          </h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            Obrigatória para salvar ou submeter a alteração
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
          placeholder="Descreva o motivo da alteração no quadro de RH..."
        />
        {justificativaErro && (
          <p className="text-xs font-medium text-red-600">{justificativaErro}</p>
        )}
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
                      : 'bg-blue-50 text-blue-50 border border-blue-100',
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
      <div className="flex items-center justify-between p-6 bg-slate-100 border border-slate-200 rounded-lg gap-4">
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
        <KpiFontesBolas
          totalFontes={totalFontes}
          totalBolsas={totalEquipeProposta}
          className="flex-1 mx-6"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSalvar}
            disabled={salvando || submetendo || excedeOrcamento || !justificativa.trim() || !temMembrosProposta}
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
            disabled={salvando || submetendo || excedeOrcamento || !justificativa.trim() || !temMembrosProposta}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
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
                      className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg text-left cursor-pointer group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                        {c.nome.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{c.nome}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {CATEGORIA_BOLSA_LABELS[c.categoria]?.nivel ?? c.categoria}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded-md group-hover:bg-slate-900 group-hover:text-white transition-all">
                        ADICIONAR
                      </span>
                    </button>
                  ))
                : buscandoEspecialistas ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mx-auto mb-2"></div>
                      <p className="text-xs text-slate-400 font-medium">Buscando especialistas...</p>
                    </div>
                  ) : especialistas.length === 0 ? (
                    <p className="p-8 text-center text-slate-400 text-xs font-medium">
                      Nenhum especialista encontrado
                    </p>
                  ) : (
                    especialistas.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => addMembro(e.matricula, e.nome, CategoriaBolsa.PESQUISADOR_PLENO)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg text-left cursor-pointer group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                          {e.nome.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{e.nome}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Matricula: {e.matricula}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded-md group-hover:bg-slate-900 group-hover:text-white transition-all">
                          ADICIONAR
                        </span>
                      </button>
                    ))
                  )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de saída de membro existente */}
      {membroSaidaPendente && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-base font-bold text-slate-900">Data de saída</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Informe quando {membroSaidaPendente.nome_pesquisador} deixa o projeto.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Saída do projeto
              </label>
              <input
                type="date"
                value={dataSaida}
                min={membroSaidaPendente.data_inicio}
                max={projeto?.data_fim}
                onChange={(event) => {
                  setDataSaida(event.target.value);
                  if (erroDataSaida) setErroDataSaida(null);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white"
              />
              {erroDataSaida && (
                <p className="text-xs font-medium text-red-600">{erroDataSaida}</p>
              )}
              <p className="text-[11px] leading-relaxed text-slate-500">
                O membro permanece na equipe proposta com a data final ajustada, preservando o
                histórico na comparação da alteração.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={fecharModalSaida}
                className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSaidaMembro}
                className="py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Confirmar saída
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de sucesso (rascunho salvo) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-base font-bold text-slate-900">Rascunho salvo</h3>
                <p className="text-xs text-slate-500 mt-1">
                  As mudanças continuam em edição até a submissão.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Link
                to={`/solicitacoes/${solicitacaoId}/comparacao`}
                className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                <GitCompare size={14} />
                Comparar
              </Link>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de submissão final */}
      {showAprovadaModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm p-5 rounded-xl shadow-2xl relative z-10 border border-slate-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 shrink-0">
                <FileCheck size={20} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-base font-bold text-slate-900">Alteração aprovada</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Solicitação #{aprovadaSolicitacaoId}. A equipe proposta já está vigente no projeto.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Link
                to={`/solicitacoes/${aprovadaSolicitacaoId}/comparacao`}
                className="py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                <GitCompare size={14} />
                Ver Comparação
              </Link>
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
    </div>
  );
}
