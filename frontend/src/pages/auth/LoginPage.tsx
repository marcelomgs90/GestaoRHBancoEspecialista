import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, LogIn, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe a senha'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitError(null);
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setSubmitError(error.response?.data?.detail ?? 'E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestão RH</h1>
          <p className="text-blue-100 mt-1 text-sm font-medium">Banco de Especialistas — Polo IFPB</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6" noValidate>
          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2"
            >
              E-mail
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11 text-sm font-medium"
                placeholder="seu.email@ifpb.edu.br"
              />
              <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                {...register('senha')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11 text-sm font-medium"
                placeholder="Digite sua senha"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            {errors.senha && (
              <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? 'Entrando...' : 'Acessar Sistema'}
          </button>

          <p className="text-center text-[10px] uppercase tracking-widest text-slate-400 pt-4 border-t border-slate-100">
            Polo de Inovação do IFPB
          </p>
        </form>
      </div>
    </div>
  );
}
