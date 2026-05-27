import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { projetoService } from '@/services/projetoService';
import type { AxiosError } from 'axios';

const schema = z
  .object({
    codigo: z.string().min(1, 'Informe o código do projeto'),
    titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
    descricao: z.string().optional(),
    data_inicio: z.string().min(1, 'Informe a data de início'),
    data_fim: z.string().min(1, 'Informe a data de encerramento'),
  })
  .refine((d) => !d.data_inicio || !d.data_fim || d.data_fim >= d.data_inicio, {
    message: 'Data de encerramento deve ser posterior ao início',
    path: ['data_fim'],
  });

type FormData = z.infer<typeof schema>;

export default function ProjetoFormPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [codigoCriado, setCodigoCriado] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      const projeto = await projetoService.criar(data);
      setCodigoCriado(projeto.codigo);
      setSucesso(true);
    } catch (err) {
      const ax = err as AxiosError<{ detail: string }>;
      setSubmitError(ax.response?.data?.detail ?? 'Erro ao criar projeto. Tente novamente.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Novo Projeto</h2>
          <p className="text-slate-700 font-medium">Configure os parâmetros básicos do projeto.</p>
        </div>
        <button
          onClick={() => navigate('/projetos')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
              Identificação
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Título do Projeto
              </label>
              <input
                type="text"
                {...register('titulo')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900"
                placeholder="Ex: Desenvolvimento de Novas Baterias..."
              />
              {errors.titulo && (
                <p className="text-xs text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Código
              </label>
              <input
                type="text"
                {...register('codigo')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-black text-sm uppercase tracking-wider text-slate-900"
                placeholder="P2026-001"
              />
              {errors.codigo && (
                <p className="text-xs text-red-600">{errors.codigo.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Descrição (opcional)
            </label>
            <textarea
              rows={3}
              {...register('descricao')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-sm text-slate-900 resize-none"
              placeholder="Descreva o objetivo principal..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Início da Operação
              </label>
              <input
                type="date"
                {...register('data_inicio')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900"
              />
              {errors.data_inicio && (
                <p className="text-xs text-red-600">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Encerramento Previsto
              </label>
              <input
                type="date"
                {...register('data_fim')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm text-slate-900"
              />
              {errors.data_fim && (
                <p className="text-xs text-red-600">{errors.data_fim.message}</p>
              )}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-6 pt-4">
          <button
            type="button"
            onClick={() => navigate('/projetos')}
            className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
          >
            <Save size={18} />
            {isSubmitting ? 'Salvando...' : 'Cadastrar Projeto'}
          </button>
        </div>
      </form>

      {sucesso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => navigate('/projetos')} />
          <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Projeto Criado!</h3>
            <p className="text-slate-500 font-medium mb-8">
              O projeto <span className="text-blue-600 font-bold">{codigoCriado}</span> foi
              cadastrado com sucesso.
            </p>
            <button
              onClick={() => navigate('/projetos')}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
            >
              Ver lista de projetos
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
