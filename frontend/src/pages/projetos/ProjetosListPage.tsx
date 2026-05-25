import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Plus, ChevronRight, Calendar } from 'lucide-react';
import { usePerfil } from '@/hooks/usePerfil';
import { projetoService } from '@/services/projetoService';
import { formatDate } from '@/types/projeto';
import type { Projeto } from '@/types/projeto';

export default function ProjetosListPage() {
  const navigate = useNavigate();
  const { podeCriarProjeto } = usePerfil();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    projetoService
      .listar()
      .then(setProjetos)
      .catch(() => setErro('Nao foi possivel carregar os projetos.'))
      .finally(() => setIsLoading(false));
  }, []);

  const projetosFiltrados = projetos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
      p.titulo.toLowerCase().includes(filtro.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in slide-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-4 flex-1">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Catalogo de Projetos</h2>
            <p className="text-slate-700 text-sm mt-1">
              Lista completa de ativos institucionais sob gestao do Polo.
            </p>
          </div>
          <div className="relative group max-w-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Pesquisar por codigo ou titulo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <Filter size={14} className="mr-2" />
            Filtros
          </button>
          {podeCriarProjeto && (
            <Link
              to="/projetos/novo"
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus size={16} className="mr-2" />
              Novo Projeto
            </Link>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">Carregando projetos...</p>
        </div>
      )}

      {erro && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {!isLoading && !erro && (
        <div className="space-y-4">
          {projetosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-400 font-medium">Nenhum projeto encontrado.</p>
            </div>
          ) : (
            projetosFiltrados.map((projeto, idx) => (
              <motion.div
                key={projeto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div
                  onClick={() => navigate(`/projetos/${projeto.id}`)}
                  className="group block bg-white border border-slate-200 p-6 rounded-lg hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                          ID: {projeto.id}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {projeto.codigo}
                        </h3>
                      </div>
                      <p className="text-slate-500 text-sm font-medium line-clamp-1 leading-none">
                        {projeto.titulo}
                      </p>
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                          Vigencia
                        </p>
                        <div className="flex items-center text-slate-700 font-semibold text-sm">
                          <Calendar size={14} className="mr-2 text-slate-400" />
                          {formatDate(projeto.data_inicio)} — {formatDate(projeto.data_fim)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                          Status
                        </p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200">
                          {projeto.status}
                        </span>
                      </div>

                      <div className="hidden lg:block">
                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
