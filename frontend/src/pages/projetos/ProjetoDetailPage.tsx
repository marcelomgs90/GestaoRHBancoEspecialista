import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  Activity,
  Calendar,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { usePerfil } from '@/hooks/usePerfil';
import { useAuth } from '@/contexts/AuthContext';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { formatDate, CATEGORIA_BOLSA_LABELS } from '@/types/projeto';
import {
  FONTE_LABELS,
  STATUS_SOLICITACAO_LABELS,
  TIPO_SOLICITACAO_LABELS,
  StatusSolicitacao,
} from '@/types/enums';
import type { Projeto, VersaoRHProjeto } from '@/types/projeto';
import type { Membro, Solicitacao } from '@/types/solicitacao';

const STATUS_COLORS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.EM_EDICAO]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [StatusSolicitacao.SUBMETIDA]: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  [StatusSolicitacao.APROVADA]: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  [StatusSolicitacao.REJEITADA]: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

export default function ProjetoDetailPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { podeCriarProjeto } = usePerfil();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [versoes, setVersoes] = useState<VersaoRHProjeto[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const projetoId = Number(id_projeto);

  useEffect(() => {
    if (!projetoId) return;

    async function load() {
      try {
        const [p, v, s] = await Promise.all([
          projetoService.obter(projetoId),
          projetoService.listarVersoes(projetoId),
          solicitacaoService.listar(projetoId),
        ]);
        setProjeto(p);
        setVersoes(v);
        setSolicitacoes(s);

        // busca membros da versão VIGENTE ou da última solicitação aprovada
        const versaoVigente = v.find((ver) => ver.status === 'VIGENTE');
        if (versaoVigente?.solicitacao_id) {
          const m = await solicitacaoService.listarMembros(versaoVigente.solicitacao_id);
          setMembros(m);
        } else if (s.length > 0) {
          // fallback: membros da solicitação mais recente
          const mFallback = await solicitacaoService.listarMembros(s[s.length - 1].id);
          setMembros(mFallback);
        }
      } catch {
        setErro('Não foi possível carregar os dados do projeto.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [projetoId]);

  const isCoordenador = user?.id === projeto?.coordenador_id;
  const podeEditar = isCoordenador || podeCriarProjeto;

  const versaoVigente = versoes.find((v) => v.status === 'VIGENTE');
  const solicitacoesOrdenadas = [...solicitacoes].sort((a, b) => {
    if (a.id === versaoVigente?.solicitacao_id) return -1;
    if (b.id === versaoVigente?.solicitacao_id) return 1;
    return b.id - a.id;
  }).slice(0, 3);
  const versoesLimitadas = [...versoes].sort((a, b) => b.id - a.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-400 text-sm">Carregando projeto...</p>
      </div>
    );
  }

  if (erro || !projeto) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/projetos')} className="flex items-center text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-widest gap-1 cursor-pointer">
          <ArrowLeft size={14} /> Voltar
        </button>
        <p className="text-red-600 text-sm">{erro ?? 'Projeto não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center text-slate-600 hover:text-slate-950 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={14} className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Voltar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Informações gerais */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                    ID: {projeto.id}
                  </span>
                  <span className="text-slate-700 font-bold text-lg">{projeto.codigo}</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100">
                  {projeto.status}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-950 leading-tight">{projeto.titulo}</h2>
              {projeto.descricao && (
                <p className="text-slate-800 text-sm leading-relaxed">{projeto.descricao}</p>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 py-6 border-y border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Código</p>
                <p className="font-bold text-slate-900 text-sm">{projeto.codigo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Início</p>
                <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                  <Calendar size={12} className="text-slate-400" />
                  {formatDate(projeto.data_inicio)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Encerramento</p>
                <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                  <Calendar size={12} className="text-slate-400" />
                  {formatDate(projeto.data_fim)}
                </div>
              </div>
            </div>
          </section>

          {/* Quadro de RH */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 text-slate-600 rounded">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 uppercase tracking-wider">
                    Recursos Humanos
                  </h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    {membros.length} pesquisadores alocados
                  </p>
                </div>
              </div>

              {podeEditar && (
                <div className="flex items-center gap-2">
                  {versoes.some((v) => v.status === 'VIGENTE') ? (
                    <Link
                      to={`/projetos/${projeto.id}/alteracao`}
                      className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <Plus size={14} className="mr-2" />
                      Solicitar Alteração
                    </Link>
                  ) : (
                    <Link
                      to={`/projetos/${projeto.id}/implantacao`}
                      className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <Plus size={14} className="mr-2" />
                      Implantação Inicial
                    </Link>
                  )}
                </div>
              )}
            </div>

            {membros.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nenhum membro alocado neste projeto
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">
                      <th className="pb-3 px-2">Pesquisador</th>
                      <th className="pb-3">Categoria</th>
                      <th className="pb-3 text-center">CH Semanal</th>
                      <th className="pb-3">Fonte</th>
                      <th className="pb-3 text-right">Bolsa Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membros.map((m) => {
                      const cat = CATEGORIA_BOLSA_LABELS[m.categoria_bolsa];
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                {m.nome_pesquisador.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-950 text-sm whitespace-nowrap">
                                {m.nome_pesquisador}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{cat?.funcao ?? '—'}</span>
                              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                {cat?.nivel ?? m.categoria_bolsa}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <span className="text-xs font-bold text-slate-600">{m.carga_horaria_semanal}h</span>
                          </td>
                          <td className="py-4">
                            <span className="text-xs font-medium text-slate-700">
                              {FONTE_LABELS[m.fonte_financiamento] ?? m.fonte_financiamento}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              R$ {Number(m.valor_bolsa).toLocaleString('pt-BR')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Versoes RH */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={14} className="text-slate-600" />
              <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
                Versões de Quadro RH
              </h4>
            </div>
            {versoesLimitadas.length === 0 ? (
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold text-center py-4">
                Nenhuma versão registrada
              </p>
            ) : (
              <div className="space-y-3">
                {versoesLimitadas.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Versão {v.numero_versao}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        {formatDate(v.criado_em)}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        v.status === 'VIGENTE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : v.status === 'PROPOSTA'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitacoes */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-slate-600" />
                <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">Solicitações</h4>
              </div>
              <Link
                to="/solicitacoes"
                className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {solicitacoesOrdenadas.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4 uppercase tracking-widest font-bold">
                Nenhuma solicitação para este projeto
              </p>
            ) : (
              <div className="space-y-2">
                {solicitacoesOrdenadas.map((sol) => (
                  <Link
                    key={sol.id}
                    to={`/solicitacoes/${sol.id}/comparacao`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={12} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {sol.identificador}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          {TIPO_SOLICITACAO_LABELS[sol.tipo] ?? sol.tipo}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ml-2 ${STATUS_COLORS[sol.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                    >
                      {STATUS_SOLICITACAO_LABELS[sol.status] ?? sol.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
