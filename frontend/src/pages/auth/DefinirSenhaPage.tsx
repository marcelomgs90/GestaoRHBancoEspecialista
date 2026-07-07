import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Lock } from 'lucide-react'
import { authService } from '@/services/authService'
import type { ConvitePrimeiroAcesso } from '@/types/auth'

const schema = z
  .object({
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmar_senha: z.string().min(8, 'Confirme a senha'),
  })
  .refine((data) => data.senha === data.confirmar_senha, {
    message: 'As senhas nao conferem',
    path: ['confirmar_senha'],
  })

type FormData = z.infer<typeof schema>

export default function DefinirSenhaPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [convite, setConvite] = useState<ConvitePrimeiroAcesso | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { senha: '', confirmar_senha: '' },
  })

  useEffect(() => {
    if (!token) {
      setErro('Convite invalido.')
      setIsLoading(false)
      return
    }

    authService
      .validarConvite(token)
      .then(setConvite)
      .catch((err) => {
        const detail = err?.response?.data?.detail
        setErro(detail ?? 'Convite invalido ou expirado.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setErro(null)
    try {
      await authService.definirSenhaConvite(token, data)
      setSucesso(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err: any) {
      setErro(err?.response?.data?.detail ?? 'Nao foi possivel definir a senha.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Definir senha</h1>
          <p className="text-slate-300 mt-1 text-sm font-medium">Primeiro acesso ao Gestao RH</p>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Validando convite...
            </div>
          ) : erro && !convite ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          ) : sucesso ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>Senha definida com sucesso. Redirecionando para login...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-900">{convite?.nome}</p>
                <p className="text-xs text-slate-500">{convite?.email}</p>
              </div>

              {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...register('senha')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11 text-sm font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                {errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmar_senha')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11 text-sm font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                {errors.confirmar_senha && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmar_senha.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? 'Salvando...' : 'Definir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
