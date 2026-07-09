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
  nivel: Nivel;
  href: string;
  /** Ordem de exibição: menor = mais no topo. */
  peso: number;
}

function diasAte(iso: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const alvo = new Date(y, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function rotuloProjeto(p: Projeto): string {
  return p.sigla || p.codigo || p.titulo || `Projeto #${p.id}`;
}

function calcular(
  projetos: Projeto[],
  solicitacoes: Solicitacao[],
  podeAprovar: boolean,
): Notificacao[] {
  const list: Notificacao[] = [];

  // 1) Solicitações SUBMETIDAS — uma por item, leva à página de comparação.
  if (podeAprovar) {
    for (const s of solicitacoes) {
      if (s.status !== StatusSolicitacao.SUBMETIDA) continue;
      list.push({
        id: `sol-${s.id}`,
        icon: ClipboardCheck,
        titulo: `Solicitação ${s.identificador}`,
        descricao: 'Aguardando aprovação',
        nivel: 'normal',
        href: `/solicitacoes/${s.id}/comparacao`,
        peso: 100, // depois dos projetos urgentes
      });
    }
  }

  // 2) Projetos ATIVOS por proximidade do fim.
  for (const p of projetos) {
    if (p.status !== StatusProjeto.ATIVO) continue;
    const d = diasAte(p.data_fim);
    if (d < 0) {
      list.push({
        id: `proj-vencido-${p.id}`,
        icon: AlertCircle,
        titulo: rotuloProjeto(p),
        descricao: `Vigência vencida há ${-d} dia${d === -1 ? '' : 's'}`,
        nivel: 'urgente',
        href: `/projetos/${p.id}`,
        peso: -d, // mais vencido, mais no topo
      });
    } else if (d <= 60) {
      list.push({
        id: `proj-vencendo-${p.id}`,
        icon: Clock,
        titulo: rotuloProjeto(p),
        descricao: d === 0 ? 'Termina hoje' : `Termina em ${d} dia${d === 1 ? '' : 's'}`,
        nivel: d <= 30 ? 'urgente' : 'normal',
        href: `/projetos/${p.id}`,
        peso: d + 1, // quanto mais perto de acabar, mais no topo
      });
    }
  }

  list.sort((a, b) => {
    if (a.nivel !== b.nivel) return a.nivel === 'urgente' ? -1 : 1;
    return a.peso - b.peso;
  });

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
  const total = items.length;
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
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.titulo}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.descricao}
                      </p>
                    </div>
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
