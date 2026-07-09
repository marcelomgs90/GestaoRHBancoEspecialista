import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ClipboardCheck,
  Clock,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { usePerfil } from '@/hooks/usePerfil';
import { projetoService } from '@/services/projetoService';
import { solicitacaoService } from '@/services/solicitacaoService';
import { StatusProjeto, StatusSolicitacao } from '@/types/enums';
import { cn } from '@/lib/cn';
import type { Projeto } from '@/types/projeto';
import type { Solicitacao } from '@/types/solicitacao';

type Nivel = 'normal' | 'urgente';

interface Notificacao {
  id: string;
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  count: number;
  nivel: Nivel;
  href: string;
}

function diasAte(iso: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const alvo = new Date(y, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function calcular(
  projetos: Projeto[],
  solicitacoes: Solicitacao[],
  podeAprovar: boolean,
): Notificacao[] {
  const list: Notificacao[] = [];

  if (podeAprovar) {
    const submetidas = solicitacoes.filter((s) => s.status === StatusSolicitacao.SUBMETIDA).length;
    if (submetidas > 0) {
      list.push({
        id: 'sol-submetidas',
        icon: ClipboardCheck,
        titulo: 'Solicitações aguardando aprovação',
        descricao: `${submetidas} submetida${submetidas > 1 ? 's' : ''} pendente${submetidas > 1 ? 's' : ''}`,
        count: submetidas,
        nivel: 'normal',
        href: `/solicitacoes?status=${StatusSolicitacao.SUBMETIDA}`,
      });
    }
  }

  const ativos = projetos.filter((p) => p.status === StatusProjeto.ATIVO);
  const vencidos = ativos.filter((p) => diasAte(p.data_fim) < 0);
  const vencendo = ativos.filter((p) => {
    const d = diasAte(p.data_fim);
    return d >= 0 && d <= 60;
  });

  if (vencidos.length > 0) {
    list.push({
      id: 'proj-vencidos',
      icon: AlertCircle,
      titulo: 'Projetos com vigência vencida',
      descricao: `${vencidos.length} ativo${vencidos.length > 1 ? 's' : ''} sem renovação`,
      count: vencidos.length,
      nivel: 'urgente',
      href: '/projetos?status=ATIVO',
    });
  }
  if (vencendo.length > 0) {
    const proximos = vencendo.filter((p) => diasAte(p.data_fim) <= 30).length;
    list.push({
      id: 'proj-vencendo',
      icon: Clock,
      titulo: 'Projetos próximos ao fim',
      descricao: `${vencendo.length} termina${vencendo.length > 1 ? 'm' : ''} em ≤ 60 dias`,
      count: vencendo.length,
      nivel: proximos > 0 ? 'urgente' : 'normal',
      href: '/projetos?status=ATIVO',
    });
  }

  return list;
}

export function NotificationsBell() {
  const { podeAprovarSolicitacao } = usePerfil();
  const [open, setOpen] = useState(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
        /* silencia — sem notificações se API falhar */
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const items = useMemo(
    () => calcular(projetos, solicitacoes, podeAprovarSolicitacao),
    [projetos, solicitacoes, podeAprovarSolicitacao],
  );
  const total = items.reduce((acc, i) => acc + i.count, 0);
  const hasUrgente = items.some((i) => i.nivel === 'urgente');

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-md transition-all cursor-pointer dark:hover:text-slate-300"
        aria-label={total > 0 ? `${total} notificações pendentes` : 'Notificações'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={18} />
        {total > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white rounded-full border-2 border-white dark:border-slate-900',
              hasUrgente ? 'bg-red-600' : 'bg-blue-600',
            )}
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Notificações
            </h3>
            {total > 0 && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {total} pendente{total > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">Nada por aqui ✓</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded flex items-center justify-center shrink-0',
                        item.nivel === 'urgente'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-600',
                      )}
                    >
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.titulo}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.descricao}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                        item.nivel === 'urgente'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-slate-100 text-slate-600 dark:text-slate-300',
                      )}
                    >
                      {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
