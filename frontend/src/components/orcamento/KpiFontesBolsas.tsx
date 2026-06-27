import { cn } from '@/lib/cn';

export interface KpiFontesBolsasProps {
  totalFontes: number;
  totalBolsas: number;
  className?: string;
}

const formatCurrencyBRL = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

/**
 * KPI compartilhado entre as telas de Implantação e Alteração.
 *
 * Mostra três colunas (Total de Fontes / Total de Bolsas / Saldo).
 * Quando `totalBolsas > totalFontes`, fundo vermelho + texto
 * "Total de bolsas excede o orçamento das fontes do projeto".
 *
 * O caller deve passar `className="mx-6"` (ou equivalente) para ocupar
 * o espaço disponível entre botões laterais, mantendo o layout original.
 */
export function KpiFontesBolas({
  totalFontes,
  totalBolsas,
  className,
}: KpiFontesBolsasProps) {
  const saldo = totalFontes - totalBolsas;
  const excedeOrcamento = totalBolsas > totalFontes;
  const formatSaldo = (v: number): string =>
    excedeOrcamento ? `-${formatCurrencyBRL(Math.abs(v))}` : formatCurrencyBRL(v);

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        excedeOrcamento
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-white border-slate-200 text-slate-700',
        className,
      )}
    >
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest">Fontes</p>
          <p className="text-sm font-bold">{formatCurrencyBRL(totalFontes)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest">Bolsas</p>
          <p className="text-sm font-bold">{formatCurrencyBRL(totalBolsas)}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest">Saldo</p>
          <p className="text-sm font-bold">{formatSaldo(saldo)}</p>
        </div>
      </div>
      {excedeOrcamento && (
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest">
          Total de bolsas excede o orçamento das fontes do projeto
        </p>
      )}
    </div>
  );
}
