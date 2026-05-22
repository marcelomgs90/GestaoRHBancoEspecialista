
import React from 'react';
import { User, UserRole } from '../types/legacy';
import { mockProjects, mockUsers } from '../lib/mockData';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  Building2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectListProps {
  user: User;
}

export default function ProjectList({ user }: ProjectListProps) {
  const isGestor = user.role === UserRole.GESTOR;
  const projects = isGestor 
    ? mockProjects 
    : mockProjects.filter(p => p.coordinatorId === user.id);

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-4 flex-1">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Catálogo de Projetos</h2>
            <p className="text-slate-700 text-sm mt-1">Lista completa de ativos institucionais sob gestão do Polo.</p>
          </div>
          <div className="relative group max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar por acrônimo ou título..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <Filter size={14} className="mr-2" />
            Filtros
          </button>
          {isGestor && (
            <Link 
              to="/projects/new"
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus size={16} className="mr-2" />
              Novo Projeto
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link 
              to={`/projects/${project.id}`}
              className="group block bg-white border border-slate-200 p-6 rounded-lg hover:border-slate-400 hover:shadow-md transition-all relative cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                       PROJ.{String(project.id).padStart(3, '0')}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {project.acronym}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-sm font-medium line-clamp-1 leading-none">{project.title}</p>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Vigência</p>
                    <div className="flex items-center text-slate-700 font-semibold text-sm">
                      <Calendar size={14} className="mr-2 text-slate-400" />
                      {new Date(project.startDate).getFullYear()} — {new Date(project.endDate).getFullYear()}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Entidades</p>
                    <div className="flex items-center text-slate-700 font-semibold text-sm">
                      <Building2 size={14} className="mr-2 text-slate-400" />
                      {project.companies.length} Parceiros
                    </div>
                  </div>

                  <div className="space-y-1 min-w-[150px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Investimento</p>
                    <p className="text-base font-bold text-slate-900">
                      <span className="text-slate-400 text-xs mr-1 font-normal">R$</span> 
                      {project.totalValue.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="hidden lg:block">
                     <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                        <ChevronRight size={18} />
                     </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
