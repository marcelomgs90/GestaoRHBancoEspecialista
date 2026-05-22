
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HRMember,
  User,
  UserRole
} from '../types/legacy';
import { mockProjects, mockHRMembers, mockUsers } from '../lib/mockData';
import { 
  ArrowLeft, 
  Edit3, 
  Users, 
  FileText, 
  Calendar, 
  CreditCard, 
  Activity, 
  Download,
  Eye,
  Plus,
  TrendingUp,
  X,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const budgetData = [
  { period: '2024.1', projecao: 800000, saldo: 800000 },
  { period: '2024.2', projecao: 600000, saldo: 580000 },
  { period: '2025.1', projecao: 400000, saldo: 420000 },
  { period: '2025.2', projecao: 200000, saldo: 150000 },
  { period: 'Final', projecao: 0, saldo: 0 },
];

interface ProjectDetailsProps {
  user: User;
}

export default function ProjectDetails({ user }: ProjectDetailsProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPdf, setShowPdf] = useState(false);
  const [editingMember, setEditingMember] = useState<HRMember | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isChartMaximized, setIsChartMaximized] = useState(false);
  const [currentPageRH, setCurrentPageRH] = useState(1);

  const project = mockProjects.find(p => p.id === id);
  const allHrMembers = mockHRMembers.filter(h => h.projectId === id);
  const hrMembersCount = allHrMembers.length;
  const itemsPerPage = 5;
  const totalPagesRH = Math.ceil(hrMembersCount / itemsPerPage);
  const hrMembers = allHrMembers.slice((currentPageRH - 1) * itemsPerPage, currentPageRH * itemsPerPage);
  
  const coordinator = mockUsers.find(u => u.id === project?.coordinatorId);

  if (!project) return <div>Projeto não encontrado</div>;

  const isCoordinator = user.id === project.coordinatorId;
  const isGestor = user.role === UserRole.GESTOR;

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center text-slate-600 hover:text-slate-950 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={14} className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Voltar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informações Gerais */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                    ID: {project.id}
                  </span>
                  <span className="text-slate-700 font-bold text-lg">{project.acronym}</span>
                </div>
                {(isCoordinator || isGestor) && (
                  <button 
                    onClick={() => setIsEditingProject(true)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 hover:text-slate-950 group cursor-pointer"
                    title="Editar informações do projeto"
                  >
                    <Edit3 size={18} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-950 leading-tight">{project.title}</h2>
              <p className="text-slate-800 text-sm leading-relaxed">{project.objectDescription}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Acrônimo</p>
                <p className="font-bold text-slate-900 text-sm">{project.acronym}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Coordenador</p>
                <p className="font-bold text-slate-900 text-sm truncate">{coordinator?.name || 'Não atribuído'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Início</p>
                <p className="font-bold text-slate-900 text-sm">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Fim</p>
                <p className="font-bold text-slate-900 text-sm">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] mb-4 border-l-2 border-slate-950 pl-3">Plano de Financiamento</h4>
                <div className="space-y-3">
                  {project.resources.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg group hover:border-slate-300 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{res.source}</span>
                        <span className="text-xs font-bold text-slate-800">Recurso Aprovado</span>
                      </div>
                      <span className="text-sm font-bold text-slate-950 bg-white px-3 py-1 rounded shadow-sm border border-slate-100 italic">R$ {res.value.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-5 bg-slate-950 rounded-lg text-white mt-6 shadow-xl shadow-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -rotate-45 translate-x-12 -translate-y-12 transition-transform group-hover:scale-150"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Total Consolidado</span>
                      <span className="text-2xl font-bold tracking-tight italic">R$ {project.totalValue.toLocaleString('pt-BR')}</span>
                    </div>
                    <TrendingUp size={24} className="text-blue-400 opacity-50" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4 border-l-2 border-slate-900 pl-3">Propriedade e Documentação</h4>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white rounded shadow-sm">
                          <Activity size={16} className="text-blue-600" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Regra de PI</p>
                          <p className="text-xs font-bold text-blue-900">{project.piRule.replace(/_/g, ' ')}</p>
                       </div>
                    </div>
                    {(isCoordinator || isGestor) && (
                      <button 
                        onClick={() => setIsEditingProject(true)}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                      >
                        Alterar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Anexos</h5>
                    <span className="text-[10px] font-bold text-slate-500">{project.annexes.length}/4</span>
                  </div>
                  {project.annexes.map((doc, i) => (
                    <div 
                      key={i} 
                      onClick={() => setShowPdf(true)}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-500 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center text-slate-600 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-950 truncate max-w-[160px]">{doc}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">Documento PDF</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-2 bg-slate-100 text-slate-800 rounded hover:bg-slate-200 transition-all">
                          <Eye size={14} />
                        </div>
                        <div className="p-2 bg-slate-100 text-slate-800 rounded hover:bg-slate-200 transition-all">
                          <Download size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {project.annexes.length < 4 && (
                    <button className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:bg-blue-50/10 hover:text-blue-500 transition-all group cursor-pointer">
                      <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <Plus size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Upload de Documentação</span>
                    </button>
                  )}
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
                  <h3 className="text-lg font-bold text-slate-950 uppercase tracking-wider">Recursos Humanos</h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{hrMembers.length} Pesquisadores Alocados</p>
                </div>
              </div>

              {(isCoordinator || isGestor) && (
                <div className="flex gap-2">
                  <Link 
                    to={`/projects/${project.id}/hr/implantation`}
                    className="flex items-center px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all font-academic"
                  >
                    <Plus size={14} className="mr-2" />
                    Implantação
                  </Link>
                  <Link 
                    to={`/projects/${project.id}/hr/alteration`}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm font-academic"
                  >
                    <Activity size={14} className="mr-2" />
                    Modificação
                  </Link>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">
                    <th className="pb-3 px-2">Pesquisador</th>
                    <th className="pb-3">Função / Nível</th>
                    <th className="pb-3 text-center">Carga (h)</th>
                    <th className="pb-3">Período</th>
                    <th className="pb-3 text-right">Bolsa Mensal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hrMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      onClick={() => isGestor && setEditingMember(member)}
                      className={`${isGestor ? 'cursor-pointer' : ''} hover:bg-slate-50/50 transition-colors`}
                    >
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-950 text-sm whitespace-nowrap">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{member.role}</span>
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{member.category}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs font-bold text-slate-600">
                          {member.hoursPerMonth}h
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="text-[10px] font-medium text-slate-700 uppercase tracking-wider">
                          {new Date(member.startDate).toLocaleDateString()} — {new Date(member.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 whitespace-nowrap">R$ {member.scholarshipValue.toLocaleString('pt-BR')}</span>
                      </td>
                    </tr>
                  ))}
                  {hrMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum registro de especialização encontrado</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação RH */}
            {totalPagesRH > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Mostrando {(currentPageRH - 1) * itemsPerPage + 1} a {Math.min(currentPageRH * itemsPerPage, hrMembersCount)} de {hrMembersCount}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPageRH(p => Math.max(1, p - 1))}
                    disabled={currentPageRH === 1}
                    className="p-2 border border-slate-200 rounded bg-white text-slate-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1 px-4 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded uppercase">
                    Página {currentPageRH} <span className="text-slate-300 mx-1">/</span> {totalPagesRH}
                  </div>
                  <button 
                    onClick={() => setCurrentPageRH(p => Math.min(totalPagesRH, p + 1))}
                    disabled={currentPageRH === totalPagesRH}
                    className="p-2 border border-slate-200 rounded bg-white text-slate-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rotate-180 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Informações Laterais */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-lg border border-slate-800 relative group">
            <button 
              onClick={() => setIsChartMaximized(true)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer"
              title="Expandir gráfico"
            >
              <TrendingUp size={16} />
            </button>
            <div className="flex items-center gap-2 mb-6 text-slate-300 uppercase text-[10px] font-bold tracking-widest">
              <TrendingUp size={14} className="text-blue-400" />
              <span>Execução Orçamentária</span>
            </div>
            
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    domain={[0, 800000]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0',
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
                    stroke="#cbd5e1" 
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
                <span className="text-3xl font-bold block">19%</span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Restante</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-400">R$ 150k / R$ 800k</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-[8px] font-black uppercase text-red-500">Acima da Projeção</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico do Projeto - Vertical Column */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col max-h-[700px]">
             <div className="flex items-center gap-2 mb-4">
              <History size={14} className="text-slate-600" />
              <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">Histórico do Projeto</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {[
                { type: 'INC', label: 'INCLUSÃO', date: '02/05/2026', user: 'Ana Costa', desc: 'Proveniente de Processo Seletivo (PS-001/2026).', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { type: 'UPDT', label: 'ALTERAÇÃO', date: '28/04/2026', user: 'João Silva', desc: 'Carga horária ajustada de 40h para 60h semanais.', color: 'text-blue-700', bg: 'bg-blue-50' },
                { type: 'UPDT', label: 'CATEGORIA', date: '20/04/2026', user: 'Roberto Santos', desc: 'Rebaixamento de categoria: Sênior para Pleno conforme auditoria.', color: 'text-amber-700', bg: 'bg-amber-50' },
                { type: 'DOC', label: 'DOCUMENTO', date: '18/04/2026', user: 'Ana Costa', desc: 'Upload de Termo de Ciência e Compromisso assinado.', color: 'text-slate-700', bg: 'bg-slate-100' },
                { type: 'PAY', label: 'FONTE', date: '15/04/2026', user: 'Ana Costa', desc: 'Alteração de fonte pagadora: 100% Empresa -> 50% Empresa / 50% Embrapìi.', color: 'text-purple-700', bg: 'bg-purple-50' },
                { type: 'REM', label: 'EXCLUSÃO', date: '10/04/2026', user: 'Pedro Oliver', desc: 'Desligamento solicitado pelo coordenador técnico.', color: 'text-red-700', bg: 'bg-red-50' },
                { type: 'PROF', label: 'PERFIL', date: '05/04/2026', user: 'Maria Souza', desc: 'Mudança de perfil: Aluno para Colaborador Externo (Conclusão de Curso).', color: 'text-slate-700', bg: 'bg-slate-50' },
                { type: 'UPDT', label: 'DATA', date: '02/04/2026', user: 'Roberto Santos', desc: 'Prorrogação de prazo da entrega técnica parcial.', color: 'text-blue-700', bg: 'bg-blue-50' },
                { type: 'INC', label: 'RECURSO', date: '28/03/2026', user: 'João Silva', desc: 'Inclusão de novo item orçamentário para infraestrutura.', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { type: 'DOC', label: 'ANEXO', date: '20/03/2026', user: 'Maria Souza', desc: 'Inclusão de cronograma de atividades revisado (V2).', color: 'text-slate-700', bg: 'bg-slate-100' },
                { type: 'UPDT', label: 'STATUS', date: '15/03/2026', user: 'Admin', desc: 'Projeto movido para fase de execução plena.', color: 'text-blue-700', bg: 'bg-blue-50' },
                { type: 'INC', label: 'INÍCIO', date: '01/03/2026', user: 'Admin', desc: 'Criação do registro mestre do projeto no sistema.', color: 'text-emerald-700', bg: 'bg-emerald-50' },
              ].map((log, i) => (
                <div key={i} className="relative pl-6 pb-4 border-l border-slate-200 last:border-0 last:pb-0">
                  <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white ${log.bg.replace('bg-', 'bg-')} ring-1 ring-slate-200 shadow-sm`}></div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${log.bg} ${log.color}`}>
                      {log.label}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">{log.date}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-950 leading-tight mb-0.5">{log.desc}</p>
                  <p className="text-[9px] text-slate-500 italic">Por: {log.user}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Auditoria Sincronizada</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                <span className="text-emerald-600">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Maximizado: Gráfico Orçamentário */}
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
                    <h3 className="text-xl font-bold text-slate-900">Execução Orçamentária Detalhada</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{project.title}</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsChartMaximized(false)}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-900 shadow-sm"
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
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    domain={[0, 800000]}
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
                    name="Projeção Estipulada"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3b82f6" 
                    strokeWidth={5} 
                    dot={{ fill: '#3b82f6', r: 6, strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, stroke: '#3b82f6' }}
                    name="Saldo Remanescente Real"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-8 border-t border-slate-100 pt-10">
               <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status da Execução</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">19% de Saldo</p>
                  <div className="mt-3 flex items-center gap-2">
                     <div className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase">Alerta de Desvio</div>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Orçado</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight italic">R$ 800.000,00</p>
               </div>
               <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl shadow-slate-200 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Atualização</p>
                  <p className="text-lg font-bold text-white uppercase italic">Maio de 2026</p>
               </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Simulador de Visualização de PDF */}
      {showPdf && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowPdf(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl h-full rounded shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-100 text-slate-600 rounded">
                    <FileText size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Visualização de Documento</p>
                    <p className="text-sm font-bold text-slate-900 underline decoration-blue-500 decoration-2">{project.annexes[0]}</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowPdf(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-200 p-8 overflow-y-auto flex items-start justify-center">
              <div className="w-[800px] min-h-[1100px] bg-white shadow-xl p-16 space-y-10">
                <div className="h-12 bg-slate-100 w-1/3 mx-auto rounded"></div>
                <div className="space-y-4">
                   <div className="h-3 bg-slate-100 w-full rounded"></div>
                   <div className="h-3 bg-slate-100 w-full rounded"></div>
                   <div className="h-3 bg-slate-100 w-2/3 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-10">
                   <div className="h-32 bg-slate-50 rounded border border-slate-100"></div>
                   <div className="h-32 bg-slate-50 rounded border border-slate-100"></div>
                </div>
                <div className="pt-16 border-t border-slate-100">
                   <div className="h-3 bg-slate-100 w-1/4 rounded mb-4"></div>
                   <div className="h-24 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-300 p-4 font-mono">
                     HASH_AUTHENTICITY: 8f9a2b7c4d1e0f3...
                   </div>
                </div>
                <div className="flex justify-center pt-16">
                   <div className="px-6 py-3 border border-slate-200 rounded text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-3">
                      <FileText size={16} />
                      Documento Autenticado Institucionalmente
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {editingMember && isGestor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-5xl h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <Users size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Perfil do Pesquisador</p>
                    <p className="text-sm font-bold text-slate-900">{editingMember.name}</p>
                 </div>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex min-h-0">
              {/* Form de Edição */}
              <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100">
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                      <input 
                        type="text" 
                        defaultValue={editingMember.name}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Papel no Projeto</label>
                      <input 
                        type="text" 
                        defaultValue={editingMember.role}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                      <select 
                        defaultValue={editingMember.category}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Pleno">Pleno</option>
                        <option value="Sênior">Sênior</option>
                        <option value="Master">Master</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carga Horária (Mensal)</label>
                      <input 
                        type="number" 
                        defaultValue={editingMember.hoursPerMonth}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor da Bolsa</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                        <input 
                          type="number" 
                          defaultValue={editingMember.scholarshipValue}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data de Início</label>
                      <input 
                        type="date" 
                        defaultValue={editingMember.startDate}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data de Término</label>
                      <input 
                        type="date" 
                        defaultValue={editingMember.endDate}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fonte Pagadora</label>
                    <div className="flex gap-4">
                      {['Empresa', 'Embrapii', 'IFPB', 'Sebrae'].map(source => (
                        <label key={source} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked={editingMember.paymentSource.includes(source as any)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-600 uppercase">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      className="px-6 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-800 transition-all shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>

              {/* Histórico do Pesquisador */}
              <div className="w-[350px] bg-slate-50 p-8 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-6">
                  <History size={14} className="text-slate-600" />
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Histórico de edição do usuário</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {[
                    { date: '05/05/2026', type: 'EDT', label: 'Edição', desc: 'Alteração de carga horária para 40h.', user: 'Gestor Sistema' },
                    { date: '20/04/2026', type: 'INC', label: 'Cadastro', desc: 'Inclusão inicial no projeto via processo seletivo.', user: 'Admin' },
                    { date: '20/04/2026', type: 'DOC', label: 'Anexo', desc: 'Upload de declaração de vínculo.', user: 'Admin' },
                  ].map((log, i) => (
                    <div key={i} className="relative pl-6 pb-6 border-l border-slate-300 last:border-0 last:pb-0">
                      <div className="absolute left-[-4px] top-0.5 w-[7px] h-[7px] rounded-full bg-slate-400 border border-white"></div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase text-slate-600">{log.label}</span>
                        <span className="text-[9px] font-bold text-slate-500">{log.date}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 mb-1 leading-tight">{log.desc}</p>
                      <p className="text-[9px] text-slate-500 italic">Por: {log.user}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isEditingProject && (isCoordinator || isGestor) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-5xl h-[90vh] rounded shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 text-white rounded">
                    <Edit3 size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Editor de Projeto</p>
                    <p className="text-sm font-bold text-slate-900">{project.title}</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsEditingProject(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex min-h-0 bg-slate-50">
              <div className="flex-1 p-10 overflow-y-auto">
                <form className="bg-white p-8 rounded border border-slate-200 shadow-sm space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Informações Básicas</h4>
                    
                    <div className="grid grid-cols-4 gap-6">
                      <div className="col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Título do Projeto</label>
                        <input 
                          type="text" 
                          defaultValue={project.title}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acrônimo</label>
                        <input 
                          type="text" 
                          defaultValue={project.acronym}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Descrição do Objeto</label>
                      <textarea 
                        defaultValue={project.objectDescription}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Início</label>
                        <input 
                          type="date" 
                          defaultValue={project.startDate}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Término</label>
                        <input 
                          type="date" 
                          defaultValue={project.endDate}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Propriedade Intelectual (PI)</label>
                        <select 
                          defaultValue={project.piRule}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="EXCLUSIVA_IF">Exclusiva IF</option>
                          <option value="EXCLUSIVA_EMPRESA">Exclusiva Empresa</option>
                          <option value="COMPARTILHADA">Compartilhada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">Plano de Financiamento</h4>
                    
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                          {project.resources.map((res, i) => (
                            <div key={i} className="flex items-center gap-4">
                               <div className="w-32 py-2 px-3 bg-slate-100 rounded text-[10px] font-black text-slate-500 flex items-center justify-center uppercase tracking-widest border border-slate-200">
                                 {res.source}
                               </div>
                               <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                  <input 
                                    type="text" 
                                    defaultValue={res.value.toLocaleString('pt-BR')}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm"
                                  />
                               </div>
                            </div>
                          ))}
                          <button type="button" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:text-blue-700 transition-colors pt-2">
                             <Plus size={14} /> Adicionar Nova Fonte
                          </button>
                       </div>

                       <div className="bg-slate-900 p-8 rounded-lg flex flex-col justify-center text-center">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2">Total Consolidado</p>
                          <p className="text-3xl font-bold text-white tracking-tight italic">R$ {project.totalValue.toLocaleString('pt-BR')}</p>
                       </div>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-end gap-4 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProject(false)}
                      className="px-8 py-3 bg-white border border-slate-200 rounded text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                    >
                      Descartar Alterações
                    </button>
                    <button 
                      type="button" 
                      className="px-8 py-3 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      Salvar Projeto
                    </button>
                  </div>
                </form>
              </div>

              <div className="w-[350px] border-l border-slate-200 p-10 flex flex-col">
                 <div className="flex items-center gap-2 mb-6">
                    <History size={16} className="text-slate-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Histórico de edição do Projeto</h3>
                 </div>

                 <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                   {[
                     { date: '05/05/2026', user: 'Gestor', action: 'Atualizou valor Embrapii para R$ 120k', type: 'budget' },
                     { date: '28/04/2026', user: 'Admin', action: 'Cadastrou projeto no sistema', type: 'creation' },
                     { date: '28/04/2026', user: 'Admin', action: 'Anexou Termo de Outorga', type: 'doc' },
                   ].map((log, i) => (
                     <div key={i} className="relative pl-6 pb-2 border-l border-slate-200 last:border-0">
                       <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                       <div className="mb-1 flex items-center justify-between">
                         <span className="text-[9px] font-bold text-slate-900">{log.date}</span>
                         <span className="text-[8px] font-black uppercase text-slate-400">{log.user}</span>
                       </div>
                       <p className="text-[11px] font-bold text-slate-600 leading-tight">{log.action}</p>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
