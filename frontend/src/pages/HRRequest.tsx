
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HRMember,
  User,
  Candidate,
  Specialist
} from '../types/legacy';
import { 
  mockProjects, 
  mockHRMembers, 
  mockCandidates, 
  mockSpecialists,
  mockScholarshipTables
} from '../lib/mockData';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  FileCheck, 
  History,
  CheckCircle2,
  X,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HRRequestProps {
  user: User;
}

interface HistoryLog {
  id: string;
  type: 'ADD' | 'REMOVE' | 'UPDATE';
  memberName: string;
  detail: string;
  timestamp: Date;
}

export default function HRRequest({ user }: HRRequestProps) {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id);
  const isImplantation = type === 'implantation';

  const [members, setMembers] = useState<HRMember[]>(
    isImplantation ? [] : mockHRMembers.filter(h => h.projectId === id)
  );
  
  const [showSearch, setShowSearch] = useState<'candidates' | 'specialists' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [history, setHistory] = useState<HistoryLog[]>([]);

  const scholarshipValues = mockScholarshipTables[0].categories;

  const logAction = (type: HistoryLog['type'], memberName: string, detail: string) => {
    const newLog: HistoryLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      memberName,
      detail,
      timestamp: new Date()
    };
    setHistory(prev => [newLog, ...prev]);
  };

  const handleAddMember = (raw: Candidate | Specialist, source: 'PROCESS_SELECT' | 'SPECIALIST_BANK') => {
    const category = (raw as any).suggestedCategory || 'Junior';
    const newMember: HRMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: raw.name,
      projectId: id!,
      role: 'Pesquisador',
      category: category as any,
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      hoursPerMonth: 20,
      paymentSource: ['Empresa'],
      scholarshipValue: scholarshipValues[category.toLowerCase() as keyof typeof scholarshipValues],
      installments: 12,
      source: source
    };
    setMembers([...members, newMember]);
    logAction('ADD', newMember.name, `Adicionado via ${source === 'PROCESS_SELECT' ? 'Processo Seletivo' : 'Banco Especialista'}`);
    setShowSearch(null);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      logAction('REMOVE', member.name, 'Removido da lista de designação');
    }
    setMembers(members.filter(m => m.id !== memberId));
  };

  const updateMember = (memberId: string, updates: Partial<HRMember>) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      Object.entries(updates).forEach(([key, value]) => {
        if ((member as any)[key] !== value) {
          let detail = `Alterou ${key}: ${value}`;
          if (key === 'hoursPerMonth') detail = `Carga Horária: ${value}h`;
          if (key === 'category') detail = `Categoria: ${value}`;
          if (key === 'role') detail = `Função: ${value}`;
          logAction('UPDATE', member.name, detail);
        }
      });
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updated = { ...m, ...updates };
        // Recalculate scholarship if category changes
        if (updates.category) {
          updated.scholarshipValue = scholarshipValues[updates.category.toLowerCase() as keyof typeof scholarshipValues];
        }
        return updated;
      }
      return m;
    }));
  };

  const filteredCandidates = mockCandidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSpecialists = mockSpecialists.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinalize = () => {
    setGeneratingPdf(true);
    setTimeout(() => {
      setGeneratingPdf(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <button 
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold uppercase text-[10px] tracking-wider transition-colors group cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar ao Projeto
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-900">
            {isImplantation ? 'Fluxo de Implantação de RH' : 'Solicitação de Alteração de Quadro'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Projeto: <span className="text-slate-900">{project?.acronym}</span>
          </p>
        </div>
      </div>

      {/* Ações de Inclusão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setShowSearch('candidates')}
          className="flex items-center p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm cursor-pointer"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded mr-6 group-hover:bg-slate-200 transition-colors">
            <Users size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 uppercase tracking-tight text-sm">Processo Seletivo</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Candidatos Aprovados</p>
          </div>
        </button>
        
        <button 
          onClick={() => setShowSearch('specialists')}
          className="flex items-center p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm cursor-pointer"
        >
          <div className="p-3 bg-slate-900 text-white rounded mr-6">
            <UserPlus size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 uppercase tracking-tight text-sm">Banco de Especialistas</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Servidores e Remanejados</p>
          </div>
        </button>
      </div>

      {/* Lista de Membros */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              {isImplantation ? 'Designações Pendentes' : 'Quadro de Pesquisadores'}
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Aguardando geração do termo para auditagem</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
              {members.length} Especialistas
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <motion.div 
              layout
              key={member.id} 
              className="p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center"
            >
              <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-600 shrink-0">
                {member.name.charAt(0)}
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg text-slate-900 leading-none mb-2">{member.name}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        {member.source === 'PROCESS_SELECT' ? 'Processo Seletivo' : 'Banco Talentos'}
                      </span>
                      <span>ID: {member.id}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Função</label>
                    <input 
                      type="text" 
                      value={member.role}
                      onChange={(e) => updateMember(member.id, { role: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium focus:border-slate-900 outline-none transition-academic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                    <select 
                      value={member.category}
                      onChange={(e) => updateMember(member.id, { category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium focus:border-slate-900 outline-none transition-academic"
                    >
                      <option value="Junior">Iniciação / Júnior</option>
                      <option value="Pleno">Pleno / Especialista</option>
                      <option value="Master">Coordenador / Master</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carga (H/M)</label>
                    <input 
                      type="number" 
                      value={member.hoursPerMonth}
                      onChange={(e) => updateMember(member.id, { hoursPerMonth: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-bold focus:border-slate-900 outline-none transition-academic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Bolsa</label>
                    <div className="px-4 py-2 bg-slate-900 text-white font-bold rounded text-sm tracking-tight">
                      R$ {member.scholarshipValue.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {members.length === 0 && (
            <div className="p-32 text-center">
              <Users size={80} className="mx-auto mb-6 text-slate-100" />
              <p className="font-black text-slate-300 uppercase tracking-widest text-xs italic">Lista de designação vazia</p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">Adicione especialistas para prosseguir com o fluxo</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Alterações */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              Histórico de Alterações
            </h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Registro cronológico de modificações</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <History size={14} />
            <span>{history.length} Eventos</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
          {history.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-md flex items-center justify-center font-bold text-[10px]",
                  log.type === 'ADD' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  log.type === 'REMOVE' ? "bg-red-50 text-red-600 border border-red-100" :
                  "bg-blue-50 text-blue-600 border border-blue-100"
                )}>
                  {log.type}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {log.memberName}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    {log.detail}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
              Nenhum evento registrado nesta sessão
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-8 bg-slate-100 border border-slate-200 rounded-lg">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Custo Mensal Previsto</p>
          <p className="text-2xl font-bold text-slate-900">
            R$ {members.reduce((acc, curr) => acc + curr.scholarshipValue, 0).toLocaleString('pt-BR')}
          </p>
        </div>
        <button 
          onClick={handleFinalize}
          disabled={members.length === 0 || generatingPdf}
          className="flex items-center px-8 py-3 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale shadow-sm active:scale-95 cursor-pointer"
        >
          {generatingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-3"></div>
              Gerando Termo...
            </>
          ) : (
            <>
              <FileCheck size={18} className="mr-3" />
              Finalizar Solicitação
            </>
          )}
        </button>
      </div>

      {/* Modais de Busca */}
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
                  {showSearch === 'candidates' ? 'Processo Seletivo' : 'Banco de Especialistas'}
                </h3>
                <button 
                  onClick={() => setShowSearch(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded text-xs font-medium outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {showSearch === 'candidates' ? (
                  filteredCandidates.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleAddMember(c, 'PROCESS_SELECT')}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded transition-all text-left group cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Score: {c.score} | <span className="text-blue-600">{c.suggestedCategory}</span>
                        </p>
                      </div>
                      <div className="p-1 px-2 border border-slate-200 text-slate-400 rounded text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                        ADICIONAR
                      </div>
                    </button>
                  ))
                ) : (
                  filteredSpecialists.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleAddMember(s, 'SPECIALIST_BANK')}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded transition-all text-left group cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {s.currentWorkload}h Atuais | <span className="text-blue-600">{s.email}</span>
                        </p>
                      </div>
                      <div className="p-1 px-2 border border-slate-200 text-slate-400 rounded text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
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

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Sucesso!</h3>
              <p className="text-slate-500 font-medium mb-8">
                Documento de {isImplantation ? 'Implantação' : 'Alteração'} gerado com sucesso! <br />
                <span className="text-blue-600 font-bold">Faça o upload no SWAP.</span>
              </p>
              <button 
                onClick={() => navigate(`/projects/${id}`)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs cursor-pointer"
              >
                Voltar ao Projeto
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform rotate-180" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
