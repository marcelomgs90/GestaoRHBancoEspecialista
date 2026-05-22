
import React, { useState } from 'react';
import { mockScholarshipTables } from '../lib/mockData';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  DollarSign,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

export default function BolsaManagement() {
  const [tables, setTables] = useState(mockScholarshipTables);

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parâmetros Normativos</h2>
          <p className="text-slate-500 text-sm mt-1">Gestão de categorias e valores de bolsas institucionais.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
          <Plus size={16} className="mr-2" />
          Nova Tabela
        </button>
      </div>

      <div className="space-y-6">
        {tables.map((table) => (
          <div 
            key={table.id}
            className={`bg-white rounded-lg shadow-sm border ${table.active ? 'border-slate-400 ring-4 ring-slate-50' : 'border-slate-200'} p-8 transition-all relative overflow-hidden`}
          >
            {table.active && (
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-bl">
                VERSÃO VIGENTE
              </div>
            )}
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded border ${table.active ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-slate-100 text-slate-300'}`}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-none">{table.version}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
                    <Calendar size={12} className="mr-2" /> Vigência: Fluxo Contínuo Institucional
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-all cursor-pointer">
                  <Edit3 size={18} />
                </button>
                {!table.active && (
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(table.categories).map(([cat, val]) => (
                <div key={cat} className="p-6 bg-white border border-slate-200 rounded hover:border-slate-400 transition-all cursor-default">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{cat}</p>
                  <div className="flex items-end justify-between mb-6">
                    <span className="text-xl font-bold text-slate-900">R$ {Number(val).toLocaleString('pt-BR')}</span>
                    <DollarSign size={16} className="text-slate-200" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Qualificação Mínima</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">
                      {cat === 'junior' ? 'Graduação incompleta ou nível técnico avançado' : cat === 'pleno' ? 'Graduação completa com especialização ou Mestrado' : 'Doutorado completo ou sênioridade comprovada'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded flex items-center gap-4">
              <AlertCircle size={18} className="text-slate-400" />
              <p className="text-[10px] font-medium text-slate-500 leading-tight">
                Retificações nesta estrutura impactarão exclusivamente novos termos aditivos e futuras designações.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
