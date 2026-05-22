
import React from 'react';
import { User, UserRole } from '../types/legacy';
import { mockProjects, mockHRMembers } from '../lib/mockData';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Plus,
  BarChart3,
  X
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
  Line
} from 'recharts';

const budgetData = [
  { period: '2024.1', projecao: 4000000, saldo: 4000000 },
  { period: '2024.2', projecao: 3333333, saldo: 3250000 },
  { period: '2025.1', projecao: 2666666, saldo: 2800000 },
  { period: '2025.2', projecao: 2000000, saldo: 1950000 },
  { period: '2026.1', projecao: 1333333, saldo: 1100000 },
  { period: '2026.2', projecao: 666666, saldo: 450000 },
  { period: 'Final', projecao: 0, saldo: 0 },
];

const chartData = [
  { month: 'Jan', Empresa: 45000, Embrapii: 60000, IFPB: 30000, Sebrae: 15000 },
  { month: 'Fev', Empresa: 52000, Embrapii: 55000, IFPB: 25000, Sebrae: 18000 },
  { month: 'Mar', Empresa: 48000, Embrapii: 70000, IFPB: 35000, Sebrae: 12000 },
  { month: 'Abr', Empresa: 61000, Embrapii: 65000, IFPB: 28000, Sebrae: 21000 },
  { month: 'Mai', Empresa: 55000, Embrapii: 58000, IFPB: 32000, Sebrae: 16000 },
  { month: 'Jun', Empresa: 68000, Embrapii: 72000, IFPB: 40000, Sebrae: 24000 },
  { month: 'Jul', Empresa: 50000, Embrapii: 62000, IFPB: 28000, Sebrae: 14000 },
  { month: 'Ago', Empresa: 58000, Embrapii: 68000, IFPB: 33000, Sebrae: 20000 },
  { month: 'Set', Empresa: 62000, Embrapii: 75000, IFPB: 38000, Sebrae: 22000 },
  { month: 'Out', Empresa: 54000, Embrapii: 60000, IFPB: 29000, Sebrae: 17000 },
  { month: 'Nov', Empresa: 70000, Embrapii: 80000, IFPB: 43000, Sebrae: 26000 },
  { month: 'Dez', Empresa: 65000, Embrapii: 71000, IFPB: 36000, Sebrae: 25000 },
];

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const isGestor = user.role === UserRole.GESTOR;
  
  const [isChartMaximized, setIsChartMaximized] = React.useState(false);

  const myProjects = isGestor 
    ? mockProjects 
    : mockProjects.filter(p => p.coordinatorId === user.id);

  const stats = [
    { name: 'Projetos Ativos', value: myProjects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total de Pesquisados', value: mockHRMembers.filter(h => myProjects.some(p => p.id === h.projectId)).length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Solicitações Pendentes', value: 2, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Aprovadas', value: 12, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const userHours = mockHRMembers.reduce((acc, member) => {
    acc[member.name] = (acc[member.name] || 0) + member.hoursPerMonth;
    return acc;
  }, {} as Record<string, number>);

  const alerts = Object.entries(userHours)
    .map(([name, hours]) => {
      let status: 'NORMAL' | 'WARNING' | 'OVERLOAD' = 'NORMAL';
      let color = 'text-slate-600';
      let bg = 'bg-slate-50';
      let border = 'border-slate-100';

      if (hours > 60) {
        status = 'OVERLOAD';
        color = 'text-red-700';
        bg = 'bg-red-50';
        border = 'border-red-100';
      } else if (hours > 44) {
        status = 'WARNING';
        color = 'text-amber-700';
        bg = 'bg-amber-50';
        border = 'border-amber-100';
      }

      return {
        name,
        initial: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        h: `${hours}h`,
        status,
        color,
        bg,
        border,
        hours // for sorting
      };
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Dashboard Operacional</h2>
          <p className="text-slate-700 text-sm mt-1">Bem-vindo, {user.name}. Visão geral dos ativos e recursos do Polo.</p>
        </div>
        {isGestor && (
          <Link 
            to="/projects/new"
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
            className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center group transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 rounded flex items-center justify-center ${stat.bg} ${stat.color} mr-4 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{stat.name}</p>
              <p className="text-xl font-bold text-slate-950">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráfico e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-5 bg-slate-950 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Desembolso Mensal Previsto por Fonte Pagadora</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={0} barCategoryGap="25%">
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
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="rect"
                  wrapperStyle={{ 
                    paddingTop: '30px', 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
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
            <h3 className="text-[10px] font-bold text-slate-950 uppercase tracking-wider">Alertas de Alocação</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px] scrollbar-thin scrollbar-thumb-slate-200">
            {alerts.map((alerta) => (
              <div key={alerta.name} className={`flex items-center p-3 ${alerta.bg} rounded border ${alerta.border} transition-all hover:brightness-95 cursor-pointer`}>
                <div className={`w-8 h-8 rounded border ${alerta.border} ${alerta.bg} ${alerta.color} flex items-center justify-center shrink-0 mr-3 font-bold text-xs shadow-sm`}>
                  {alerta.initial}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-950 leading-none mb-1">{alerta.name}</p>
                  <div className="flex items-center justify-between">
                     <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{alerta.h} Alocação</p>
                     <span className={`text-[8px] font-black uppercase tracking-widest ${alerta.color}`}>{alerta.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
             <button className="w-full py-2 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer">Ver Relatório Completo</button>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-slate-950 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Projetos Recentes</h3>
              </div>
              <Link to="/projects" className="text-slate-600 hover:text-slate-900 font-bold text-[10px] uppercase tracking-wider cursor-pointer">Ver todos</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4">Acrônimo</th>
                    <th className="pb-4">Vigência</th>
                    <th className="pb-4">Investimento</th>
                    <th className="pb-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                            {project.acronym}
                          </span>
                          <span className="text-[10px] font-medium text-slate-600 truncate w-48">{project.title}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-medium text-slate-800">
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-900">
                        R$ {project.totalValue.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-4 text-right">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                          Operacional
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-800 relative overflow-hidden group">
            <button 
              onClick={() => setIsChartMaximized(true)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-300 hover:text-white z-10"
              title="Expandir gráfico"
            >
              <TrendingUp size={16} />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-300" />
              Execução Orçamentária Global
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
                    tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                    domain={[0, 4000000]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ padding: 0 }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projecao" 
                    stroke="#475569" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                    name="Projeção"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Saldo Remanescente"
                  />
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
            
            <div className="mt-6 pt-4 border-t border-white/5 text-[9px] font-medium text-slate-500 uppercase tracking-widest text-right">
              Atualizado em 05/05/2026
            </div>
          </div>
        </div>
      </div>

      {/* Maximizado: Gráfico Orçamentário Global */}
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
                 <div className="p-3 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Execução Orçamentária Global</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Visão Consolidada do Polo</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsChartMaximized(false)}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-900 shadow-sm cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                    tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                    domain={[0, 4000000]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projecao" 
                    stroke="#cbd5e1" 
                    strokeWidth={3} 
                    strokeDasharray="8 8" 
                    dot={false}
                    name="Projeção"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3b82f6" 
                    strokeWidth={5} 
                    dot={{ fill: '#3b82f6', r: 6, strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, stroke: '#3b82f6' }}
                    name="Saldo Remanescente"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-8 border-t border-slate-100 pt-10">
               <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saúde Orçamentária</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">11% Restante</p>
                  <div className="mt-3 flex items-center gap-2">
                     <div className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase">Curva de Desvio Ativa</div>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Investimento Total</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight italic">R$ 4.000.000,00</p>
               </div>
               <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl shadow-slate-200 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status de Consolidação</p>
                  <p className="text-lg font-bold text-white uppercase italic">Auditado Maio/2026</p>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
