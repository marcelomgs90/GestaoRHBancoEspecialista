import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePerfil } from '@/hooks/usePerfil';
import { cn } from '@/lib/cn';
import { NotificationsBell } from '@/components/layout/NotificationsBell';

const FEATURE_BOLSAS = import.meta.env.VITE_FEATURE_BOLSAS === 'true';

const PERFIL_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  COORDENADOR: 'Coordenador',
  GESTOR_POLO: 'Gestor do Polo',
  APOIO_COORDENADOR: 'Apoio Coordenador',
};

interface MenuLink {
  type: 'link';
  name: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface MenuGroup {
  type: 'group';
  name: string;
  icon: typeof LayoutDashboard;
  subItems: { name: string; icon: typeof LayoutDashboard; path: string }[];
}

type MenuItem = MenuLink | MenuGroup;

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { podeCriarProjeto, podeGerenciarParametros } = usePerfil();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  );
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ Projetos: true });
  const location = useLocation();
  const navigate = useNavigate();

  const projetoSubItems = [
    { name: 'Lista de Projetos', icon: Briefcase, path: '/projetos' },
    ...(podeCriarProjeto
      ? [{ name: 'Cadastrar Projeto', icon: PlusCircle, path: '/projetos/novo' }]
      : []),
  ];

  const menuItems: MenuItem[] = [
    { type: 'link', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { type: 'group', name: 'Projetos', icon: Briefcase, subItems: projetoSubItems },
    { type: 'link', name: 'Solicitações', icon: ClipboardList, path: '/solicitacoes' },
    ...(FEATURE_BOLSAS && podeGerenciarParametros
      ? [{ type: 'link' as const, name: 'Tabelas de Bolsas', icon: Settings, path: '/parametros/bolsas' }]
      : []),
  ];

  const toggleMenu = (name: string) =>
    setExpandedMenus((prev) => ({ ...prev, [name]: !prev[name] }));

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    closeSidebarOnMobile();
  }, [location.pathname]);

  if (!user) return null;

  const initial = user.nome.trim().charAt(0).toUpperCase() || '?';
  const perfilLabel = PERFIL_LABELS[user.perfil] ?? user.perfil;

  return (
    <div className="h-dvh bg-slate-50 flex overflow-hidden font-sans text-slate-800 dark:bg-slate-950">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 dark:bg-slate-900 dark:border-slate-800 lg:static lg:translate-x-0',
          isSidebarOpen ? 'w-72 translate-x-0 lg:w-64' : 'w-72 -translate-x-full lg:w-16',
        )}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold shrink-0 shadow-sm text-xs dark:bg-slate-700">
              G
            </div>
            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                <span className="text-sm font-bold tracking-tight text-slate-900 block leading-none dark:text-slate-100">
                  GESTÃO RH
                </span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1 block">
                  Banco de Especialistas
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
          {menuItems.map((item) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebarOnMobile}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded transition-all group relative duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <item.icon size={18} className={cn('shrink-0', !isSidebarOpen && 'mx-auto')} />
                  {isSidebarOpen && <span className="text-xs font-medium">{item.name}</span>}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            }

            const isExpanded = expandedMenus[item.name];
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => isSidebarOpen && toggleMenu(item.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded transition-all group relative duration-200 text-left',
                    'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <item.icon size={18} className={cn('shrink-0', !isSidebarOpen && 'mx-auto')} />
                  {isSidebarOpen && (
                    <>
                      <span className="text-xs font-medium flex-1">{item.name}</span>
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                    </>
                  )}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </button>

                {isSidebarOpen && isExpanded && (
                  <div className="pl-9 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {item.subItems.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.name}
                          to={sub.path}
                          onClick={closeSidebarOnMobile}
                          className={cn(
                            'flex items-center gap-2 py-1.5 text-xs transition-colors',
                            isSubActive
                              ? 'text-blue-600 font-bold dark:text-blue-400'
                              : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-200',
                          )}
                        >
                          <sub.icon size={14} className="shrink-0 opacity-60" />
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 text-slate-400 dark:text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 rounded transition-all text-xs font-medium group cursor-pointer',
              !isSidebarOpen && 'justify-center',
            )}
          >
            <LogOut size={18} className="text-red-500 group-hover:text-red-600 transition-colors" />
            {isSidebarOpen && <span>Encerrar sessão</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition-all border border-transparent hover:border-slate-100 cursor-pointer dark:hover:bg-slate-800 dark:hover:border-slate-700"
              aria-label="Alternar menu lateral"
            >
              <Menu size={18} />
            </button>
            <div className="relative w-full max-w-sm hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors dark:group-focus-within:text-slate-300" />
              <input
                type="text"
                placeholder="Pesquisar projetos, pesquisadores ou solicitações..."
                className="block w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-normal focus:bg-white focus:ring-0 focus:border-slate-400 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:border-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-md transition-all cursor-pointer dark:hover:text-slate-300"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <NotificationsBell />
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3 group p-1.5 rounded-lg transition-all">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none mb-1 dark:text-slate-100">{user.nome}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {perfilLabel}
                </p>
              </div>
              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
