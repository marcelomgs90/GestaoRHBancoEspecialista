import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePerfil } from '@/hooks/usePerfil';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { formatDate } from '@/types/projeto';
import { STATUS_SOLICITACAO_LABELS, StatusSolicitacao } from '@/types/enums';
import type { Projeto } from '@/types/projeto';
import type { Solicitacao } from '@/types/solicitacao';

// TODO: substituir por endpoint de relatorios quando disponivel
const budgetData = [
  { period: '2024.1', projecao: 4000000, saldo: 4000000 },
  { period: '2024.2', projecao: 3333333, saldo: 3250000 },
  { period: '2025.1', projecao: 2666666, saldo: 2800000 },
  { period: '2025.2', projecao: 2000000, saldo: 1950000 },
  { period: '2026.1', projecao: 1333333, saldo: 1100000 },
  { period: '2026.2', projecao: 666666, saldo: 450000 },
  { period: 'Final', projecao: 0, saldo: 0 },
];

// TODO: substituir por endpoint de relatorios
const chartData = [
  { month: 'Jan', Empresa: 45000, Embrapii: 60000, IFPB: 30000, Sebrae: 15000 },
  { month: 'Fev', Empresa: 52000, Embrapii: 55000, IFPB: 25000, Sebrae: 18000 },
  { month: 'Mar', Empresa: 48000, Embrapii: 70000, IFPB: 35000, Sebrae: 12000 },
  { month: 'Abr', Empresa: 61000, Embrapii: 65000, IFPB: 28000, Sebrae: 21000 },
  { month: 'Mai', Empresa: 55000, Embrapii: 58000, IFPB: 32000, Sebrae: 16000 },
  { month: 'Jun', Empresa: 68000, Embrapii: 72000, IFPB: 40000, Sebrae: 24000 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { podeCriarProjeto } = usePerfil();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartMaximized, setIsChartMaximized] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ps, ss] = await Promise.all([
          projetoService.listar(),
          solicitacaoService.listar(),
        ]);
        setProjetos(ps);
        setSolicitacoes(ss);
      } catch {
        // silencia — dados ficam vazios
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const projetosAtivos = projetos.filter((p) => p.status === 'ATIVO');
  const pendentes = solicitacoes.filter((s) => s.status === StatusSolicitacao.SUBMETIDA).length;
  const aprovadas = solicitacoes.filter((s) => s.status === StatusSolicitacao.APROVADA).length;

  const stats = [
    {
      name: 'Projetos Ativos',
      value: isLoading ? '—' : projetosAtivos.length,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Total de Projetos',
      value: isLoading ? '—' : projetos.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Solicitacoes Pendentes',
      value: isLoading ? '—' : pendentes,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      name: 'Aprovadas',
      value: isLoading ? '—' : aprovadas,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Dashboard Operacional</h2>
          <p className="text-slate-700 text-sm mt-1">
            Bem-vindo, {user?.nome}. Visao geral dos ativos e recursos do Polo.
          </p>
        </div>
        {podeCriarProjeto && (
          <Link
            to="/projetos/novo"
            className="flex items-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded font-semibold text-xs uppercase tracking-wider transition-all"
          >
            <Plus size={16} className="mr-2" />
            Novo Projeto
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center"
          >
            <div
              className={`w-12 h-12 rounded flex items-center justify-center ${stat.bg} ${stat.color} mr-4`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {stat.name}
              </p>
              <p className="text-xl font-bold text-slate-950">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-slate-950 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Desembolso Mensal Previsto por Fonte Pagadora
            </h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-auto">
              TODO: endpoint relatórios
            </span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(v) => `R$ ${v / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: '24px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}
                />
                <Bar dataKey="Empresa" stackId="a" fill="#0f172a" />
                <Bar dataKey="Embrapii" stackId="a" fill="#1e40af" />
                <Bar dataKey="IFPB" stackId="a" fill="#475569" />
                <Bar dataKey="Sebrae" stackId="a" fill="#94a3b8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-950 text-white rounded">
              <AlertCircle size={14} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-950 uppercase tracking-wider">
              Status de Solicitacoes
            </h3>
          </div>
          <div className="flex-1 space-y-3">
            {Object.values(StatusSolicitacao).map((status) => {
              const count = solicitacoes.filter((s) => s.status === status).length;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100"
                >
                  <span className="text-xs font-bold text-slate-700">
                    {STATUS_SOLICITACAO_LABELS[status]}
                  </span>
                  <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {isLoading ? '—' : count}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/solicitacoes')}
            className="mt-4 w-full py-2 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            Ver todas as solicitacoes
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-slate-950 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                  Projetos Recentes
                </h3>
              </div>
              <Link
                to="/projetos"
                className="text-slate-600 hover:text-slate-900 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Ver todos
              </Link>
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
            ) : projetos.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Nenhum projeto encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4">Codigo</th>
                      <th className="pb-4">Vigencia</th>
                      <th className="pb-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projetos.slice(0, 5).map((projeto) => (
                      <tr
                        key={projeto.id}
                        onClick={() => navigate(`/projetos/${projeto.id}`)}
                        className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-950 group-hover:text-blue-600 transition-colors text-sm">
                              {projeto.codigo}
                            </span>
                            <span className="text-[10px] font-medium text-slate-600 truncate w-48">
                              {projeto.titulo}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-medium text-slate-800">
                            {formatDate(projeto.data_inicio)} — {formatDate(projeto.data_fim)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                            {projeto.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-800 relative overflow-hidden">
            <button
              onClick={() => setIsChartMaximized(true)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-300 hover:text-white z-10 cursor-pointer"
              title="Expandir grafico"
            >
              <TrendingUp size={16} />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <TrendingUp size={14} />
              Execucao Orcamentaria Global
              <span className="ml-1 text-slate-500">— TODO</span>
            </p>
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#475569' }}
                    tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`}
                    domain={[0, 4000000]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '10px' }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Line type="monotone" dataKey="projecao" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projecao" />
                  <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold tracking-tight block">11%</span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Restante</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-400">R$ 450k / R$ 4.0M</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase text-red-500">Alerta de Desvio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isChartMaximized && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsChartMaximized(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-6xl p-10 rounded-xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-lg"><TrendingUp size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Execucao Orcamentaria Global</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dados mockados — aguarda endpoint de relatorios</p>
                </div>
              </div>
              <button onClick={() => setIsChartMaximized(false)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`} domain={[0, 4000000]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  <Line type="monotone" dataKey="projecao" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="8 8" dot={false} name="Projecao" />
                  <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={5} dot={{ fill: '#3b82f6', r: 6 }} activeDot={{ r: 8 }} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
