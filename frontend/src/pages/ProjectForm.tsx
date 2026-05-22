
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle, 
  UserPlus, 
  FileUp, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ProjectResource, Specialist } from '../types/legacy';
import { mockSpecialists } from '../lib/mockData';
import { motion, AnimatePresence } from 'motion/react';

export default function ProjectForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    acronym: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [resources, setResources] = useState<ProjectResource[]>([{ source: '', value: 0 }]);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Specialist | null>(null);
  const [showCoordSearch, setShowCoordSearch] = useState(false);
  const [coordSearchTerm, setCoordSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const totalValue = resources.reduce((acc, curr) => acc + curr.value, 0);

  const handleAddResource = () => {
    setResources([...resources, { source: '', value: 0 }]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (index: number, field: keyof ProjectResource, value: any) => {
    const newResources = [...resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setResources(newResources);
  };

  const coordinators = useMemo(() => {
    const servidores = mockSpecialists.filter(s => s.isServidor);
    if (!coordSearchTerm) return servidores.slice(0, 3); // Suggestions
    return servidores.filter(s => 
      s.name.toLowerCase().includes(coordSearchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(coordSearchTerm.toLowerCase())
    );
  }, [coordSearchTerm]);

  const isFormValid = useMemo(() => {
    const hasBasicInfo = formData.title && formData.acronym && formData.description && formData.startDate && formData.endDate;
    const hasValidResources = resources.every(r => r.source && r.value > 0);
    const hasCoordinator = selectedCoordinator && selectedCoordinator.currentWorkload < 80;
    return hasBasicInfo && hasValidResources && hasCoordinator;
  }, [formData, resources, selectedCoordinator]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setShowSuccessModal(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Novo Projeto</h2>
          <p className="text-slate-700 font-medium">Configure os parâmetros técnicos e financeiros.</p>
        </div>
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors group cursor-pointer"
        >
          <X size={24} className="text-slate-400 group-hover:text-slate-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Estrutura de Identificação</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Título do Empreendimento</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-sm text-slate-900"
                placeholder="Ex: Desenvolvimento de Novos Materiais..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Acrônimo</label>
              <input 
                required
                type="text" 
                value={formData.acronym}
                onChange={(e) => setFormData(prev => ({ ...prev, acronym: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-black text-sm uppercase tracking-wider text-slate-900"
                placeholder="EX: MAT-24"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Objeto Contratual (Síntese)</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-sm text-slate-900"
              placeholder="Descreva o objetivo principal e metas pactuadas..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Início da Operação</label>
              <input 
                required
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Encerramento Previsto</label>
              <input 
                required
                type="date" 
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-sm text-slate-900"
              />
            </div>
          </div>
        </section>

        {/* Recursos Financeiros */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Distribuição de Recursos</h3>
            </div>
            <button 
              type="button"
              onClick={handleAddResource}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-lg hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100 cursor-pointer"
            >
              + Adicionar Rubrica
            </button>
          </div>

          <div className="space-y-4">
            {resources.map((res, idx) => (
              <div key={idx} className="flex gap-4 items-end animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fonte Financiadora</label>
                  <select 
                    required
                    value={res.source}
                    onChange={(e) => handleResourceChange(idx, 'source', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-300 transition-all text-slate-900"
                  >
                    <option value="">Selecione a fonte</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Embrapii">Embrapii</option>
                    <option value="PRH">PRH</option>
                    <option value="Recurso Próprio">Recurso Próprio</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Montante (BRL/R$)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    value={res.value}
                    onChange={(e) => handleResourceChange(idx, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-blue-300 text-slate-900"
                  />
                </div>
                {resources.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveResource(idx)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-slate-900 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-slate-200">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Orçado</span>
            <span className="text-3xl font-black italic tracking-tighter">R$ {totalValue.toLocaleString('pt-BR')}</span>
          </div>
        </section>

        {/* Coordenador e Regras */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Curadoria Técnica</h3>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Especialista Responsável</label>
            {!selectedCoordinator ? (
              <>
                <div className="relative">
                  <input 
                    type="text" 
                    value={coordSearchTerm}
                    onChange={(e) => {
                      setCoordSearchTerm(e.target.value);
                      setShowCoordSearch(true);
                    }}
                    onFocus={() => setShowCoordSearch(true)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900"
                    placeholder="Pesquisar por nome ou e-mail..."
                  />
                  <AnimatePresence>
                    {showCoordSearch && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCoordSearch(false)}></div>
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="p-3 bg-slate-50 border-b border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{coordSearchTerm ? 'Resultados da busca' : 'Sugestões de Especialistas'}</p>
                          </div>
                          {coordinators.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCoordinator(c);
                                setShowCoordSearch(false);
                                setCoordSearchTerm('');
                              }}
                              className="w-full px-6 py-4 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase">{c.email}</p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.currentWorkload >= 80 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {c.currentWorkload}h / 80h max
                              </div>
                            </button>
                          ))}
                          {coordinators.length === 0 && (
                            <div className="p-8 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic animate-pulse">Servidor não localizado</div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-blue-300 transition-all animate-in zoom-in-95">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 border-2 border-white flex items-center justify-center mr-4 text-blue-600 font-black shadow-sm">
                    {selectedCoordinator.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-none mb-1">{selectedCoordinator.name}</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Coordenador Alocado — {selectedCoordinator.currentWorkload}h Atuais</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedCoordinator(null)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}

            {selectedCoordinator && selectedCoordinator.currentWorkload >= 80 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="text-red-600 shrink-0" size={24} />
                <div>
                  <p className="text-xs font-black text-red-600 uppercase tracking-widest leading-none mb-1">Restrição de Carga Horária</p>
                  <p className="text-sm font-bold text-red-900">O especialista atingiu o teto regulatório de 80h/mensais. A designação não pode ser processada.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Política de PI</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900">
                <option value="EXCLUSIVA_EMPRESA">Exclusiva do Parceiro Privado</option>
                <option value="COMPARTILHADA">Propriedade Intelectual Mista</option>
                <option value="EXCLUSIVA_IF">Exclusiva do Polo Tecnológico</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Documentação Legal</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all cursor-pointer group">
                <FileUp className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Anexar Acordo Estruturante</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-6 pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/projects')}
            className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Descartar Rascunho
          </button>
          <button 
            type="submit"
            disabled={!isFormValid}
            className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
          >
            <Save size={18} />
            Efetivar Cadastro
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => navigate('/projects')}
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
              <h3 className="text-2xl font-black text-slate-900 mb-2">Projeto Criado!</h3>
              <p className="text-slate-500 font-medium mb-8">
                O registro do projeto <span className="text-blue-600 font-bold">{formData.acronym}</span> foi efetivado com sucesso no sistema.
              </p>
              <button 
                onClick={() => navigate('/projects')}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs cursor-pointer"
              >
                Continuar para lista
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
