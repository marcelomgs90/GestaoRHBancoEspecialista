import { useState } from 'react';
import { Plus, Edit3, Trash2, Settings, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { CategoriaBolsa } from '@/types/enums';
import { CATEGORIA_BOLSA_LABELS } from '@/types/projeto';

interface EntradaBolsa {
  categoria: CategoriaBolsa;
  valor_referencia: number;
}

interface TabelaLocal {
  id: string;
  nome: string;
  vigencia_inicio: string;
  ativa: boolean;
  entradas: EntradaBolsa[];
}

const TABELA_INICIAL: TabelaLocal = {
  id: 'v1',
  nome: 'Tabela 2024 — Vigente',
  vigencia_inicio: '2024-01-01',
  ativa: true,
  entradas: [
    { categoria: CategoriaBolsa.PESQUISADOR_MASTER, valor_referencia: 6000 },
    { categoria: CategoriaBolsa.PESQUISADOR_SENIOR, valor_referencia: 5000 },
    { categoria: CategoriaBolsa.PESQUISADOR_PLENO, valor_referencia: 4000 },
    { categoria: CategoriaBolsa.PESQUISADOR_JUNIOR, valor_referencia: 2000 },
    { categoria: CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO, valor_referencia: 1500 },
    { categoria: CategoriaBolsa.ESTUDANTE_SUPERIOR_INTERMEDIARIO, valor_referencia: 1200 },
    { categoria: CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE, valor_referencia: 800 },
    { categoria: CategoriaBolsa.ESTUDANTE_MEDIO, valor_referencia: 600 },
  ],
};

export default function BolsaManagementPage() {
  const [tabelas, setTabelas] = useState<TabelaLocal[]>([TABELA_INICIAL]);

  return (
    <div className="space-y-8 animate-in slide-in-up">
      {/* Banner de aviso */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-800">Tela em desenvolvimento</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Os dados exibidos são locais e <strong>não são persistidos</strong>. O endpoint{' '}
            <code className="font-mono">/parametros</code> ainda não foi implementado no backend.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parâmetros Normativos</h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de categorias e valores de bolsas institucionais.
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
          <Plus size={16} className="mr-2" />
          Nova Tabela
        </button>
      </div>

      <div className="space-y-6">
        {tabelas.map((tabela) => (
          <div
            key={tabela.id}
            className={`bg-white rounded-lg shadow-sm border ${
              tabela.ativa ? 'border-slate-400 ring-4 ring-slate-50' : 'border-slate-200'
            } p-8 transition-all relative overflow-hidden`}
          >
            {tabela.ativa && (
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-bl">
                VERSÃO VIGENTE
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded border ${
                    tabela.ativa
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-white border-slate-100 text-slate-300'
                  }`}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-none">{tabela.nome}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
                    <Calendar size={12} className="mr-2" />
                    Vigência desde {tabela.vigencia_inicio}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-all cursor-pointer">
                  <Edit3 size={18} />
                </button>
                {!tabela.ativa && (
                  <button
                    onClick={() => setTabelas((prev) => prev.filter((t) => t.id !== tabela.id))}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tabela.entradas.map((entrada) => {
                const label = CATEGORIA_BOLSA_LABELS[entrada.categoria];
                return (
                  <div
                    key={entrada.categoria}
                    className="p-5 bg-white border border-slate-200 rounded hover:border-slate-400 transition-all"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {label?.funcao ?? ''}
                    </p>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">
                      {label?.nivel ?? entrada.categoria}
                    </p>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        R$ {Number(entrada.valor_referencia).toLocaleString('pt-BR')}
                      </span>
                      <DollarSign size={14} className="text-slate-200" />
                    </div>
                  </div>
                );
              })}
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
