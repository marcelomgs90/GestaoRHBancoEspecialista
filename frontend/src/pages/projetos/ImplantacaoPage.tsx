import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { solicitacaoService } from '../../services/solicitacaoService'
import { TipoSolicitacao, FonteFinanciamento } from '../../types/enums'
import styles from './ImplantacaoPage.module.css'

const CATEGORIAS_OPTIONS = [
  { value: 'PESQUISADOR_MASTER', label: 'Pesquisador Master' },
  { value: 'PESQUISADOR_SENIOR', label: 'Pesquisador Sênior' },
  { value: 'PESQUISADOR_PLENO', label: 'Pesquisador Pleno' },
  { value: 'PESQUISADOR_JUNIOR', label: 'Pesquisador Júnior' },
  { value: 'PROFISSIONAL_SENIOR', label: 'Profissional Sênior' },
  { value: 'PROFISSIONAL_PLENO', label: 'Profissional Pleno' },
  { value: 'PROFISSIONAL_JUNIOR', label: 'Profissional Júnior' },
  { value: 'PROFISSIONAL_INICIANTE', label: 'Profissional Iniciante' },
  { value: 'ESTUDANTE_SUPERIOR_AVANCADO', label: 'Est. Superior Avançado' },
  { value: 'ESTUDANTE_SUPERIOR_INTERMEDIARIO', label: 'Est. Superior Intermediário' },
  { value: 'ESTUDANTE_SUPERIOR_INICIANTE', label: 'Est. Superior Iniciante' },
  { value: 'ESTUDANTE_MEDIO', label: 'Estudante Médio' },
]

const FONTES_OPTIONS = [
  { value: FonteFinanciamento.EMBRAPII, label: 'EMBRAPII' },
  { value: FonteFinanciamento.EMPRESA, label: 'Empresa' },
  { value: FonteFinanciamento.SEBRAE, label: 'SEBRAE' },
  { value: FonteFinanciamento.IFPB, label: 'IFPB' },
]

const ORIGEM_OPTIONS = [
  { value: 'Banco de Especialistas', label: 'Banco de Especialistas' },
  { value: 'Processo Seletivo', label: 'Processo Seletivo' },
]

interface FormData {
  nome_pesquisador: string
  ref_pesquisador: string
  categoria_bolsa: string
  fonte_financiamento: string
  carga_horaria_semanal: string
  data_inicio: string
  data_fim: string
  origem_rh: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const FORM_INICIAL: FormData = {
  nome_pesquisador: '',
  ref_pesquisador: '',
  categoria_bolsa: '',
  fonte_financiamento: '',
  carga_horaria_semanal: '',
  data_inicio: '',
  data_fim: '',
  origem_rh: '',
}

export function ImplantacaoPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>()
  const navigate = useNavigate()

  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null)
  const [isPreparando, setIsPreparando] = useState(true)
  const [isSalvando, setIsSalvando] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [form, setForm] = useState<FormData>(FORM_INICIAL)

  useEffect(() => {
    criarSolicitacao()
  }, [])

  async function criarSolicitacao() {
    try {
      const sol = await solicitacaoService.criar({
        identificador: `IMPL-${id_projeto}-${Date.now()}`,
        projeto_id: Number(id_projeto),
        tipo: TipoSolicitacao.IMPLANTACAO,
      })
      setSolicitacaoId(sol.id)
    } catch {
      setError('Não foi possível iniciar a implantação. Tente novamente.')
    } finally {
      setIsPreparando(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validar(): boolean {
    const erros: FormErrors = {}
    if (!form.nome_pesquisador.trim()) erros.nome_pesquisador = 'Campo obrigatório'
    if (!form.ref_pesquisador.trim()) erros.ref_pesquisador = 'Campo obrigatório'
    if (!form.categoria_bolsa) erros.categoria_bolsa = 'Selecione uma categoria'
    if (!form.fonte_financiamento) erros.fonte_financiamento = 'Selecione uma fonte'
    if (!form.carga_horaria_semanal) erros.carga_horaria_semanal = 'Campo obrigatório'
    if (!form.data_inicio) erros.data_inicio = 'Campo obrigatório'
    if (!form.origem_rh) erros.origem_rh = 'Selecione a origem'
    setFormErrors(erros)
    return Object.keys(erros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!solicitacaoId || !validar()) return

    setIsSalvando(true)
    setError('')
    try {
      await solicitacaoService.incluirMembro(solicitacaoId, {
        nome_pesquisador: form.nome_pesquisador,
        ref_pesquisador: form.ref_pesquisador,
        categoria_bolsa: form.categoria_bolsa as any,
        fonte_financiamento: form.fonte_financiamento as any,
        carga_horaria_semanal: Number(form.carga_horaria_semanal),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || undefined,
        origem_rh: form.origem_rh,
      })
      navigate('/projetos')
    } catch {
      setError('Erro ao incluir membro. Verifique os dados e tente novamente.')
    } finally {
      setIsSalvando(false)
    }
  }

  if (isPreparando) {
    return <div className={styles.loading}>Preparando implantação...</div>
  }

  if (!solicitacaoId) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBlock}>{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(`/projetos/${id_projeto}`)}>
          ← Voltar ao Projeto
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(`/projetos/${id_projeto}`)}>
        ← Voltar ao Projeto
      </button>

      <header className={styles.header}>
        <h1>Implantação de RH</h1>
        <p>Incluir pesquisador na equipe do projeto.</p>
      </header>

      {error && <div className={styles.errorBlock}>{error}</div>}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>

          {/* Dados do pesquisador */}
          <div className={styles.grid2}>
            <div className="form-group">
              <label className="form-label">Nome do Pesquisador *</label>
              <input
                className="form-input"
                name="nome_pesquisador"
                value={form.nome_pesquisador}
                onChange={handleChange}
                placeholder="Nome completo"
              />
              {formErrors.nome_pesquisador && (
                <span className="form-error">{formErrors.nome_pesquisador}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Referência / Matrícula *</label>
              <input
                className="form-input"
                name="ref_pesquisador"
                value={form.ref_pesquisador}
                onChange={handleChange}
                placeholder="Ex: LJ001"
              />
              {formErrors.ref_pesquisador && (
                <span className="form-error">{formErrors.ref_pesquisador}</span>
              )}
            </div>
          </div>

          {/* Categoria e fonte */}
          <div className={styles.grid2}>
            <div className="form-group">
              <label className="form-label">Categoria da Bolsa *</label>
              <select
                className="form-input"
                name="categoria_bolsa"
                value={form.categoria_bolsa}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {formErrors.categoria_bolsa && (
                <span className="form-error">{formErrors.categoria_bolsa}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Fonte de Financiamento *</label>
              <select
                className="form-input"
                name="fonte_financiamento"
                value={form.fonte_financiamento}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {FONTES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {formErrors.fonte_financiamento && (
                <span className="form-error">{formErrors.fonte_financiamento}</span>
              )}
            </div>
          </div>

          {/* Carga horária e datas */}
          <div className={styles.grid3}>
            <div className="form-group">
              <label className="form-label">Carga Horária Semanal (h) *</label>
              <input
                className="form-input"
                type="number"
                name="carga_horaria_semanal"
                value={form.carga_horaria_semanal}
                onChange={handleChange}
                placeholder="Ex: 40"
                min="1"
                max="40"
              />
              {formErrors.carga_horaria_semanal && (
                <span className="form-error">{formErrors.carga_horaria_semanal}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Data de Início *</label>
              <input
                className="form-input"
                type="date"
                name="data_inicio"
                value={form.data_inicio}
                onChange={handleChange}
              />
              {formErrors.data_inicio && (
                <span className="form-error">{formErrors.data_inicio}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Data de Fim</label>
              <input
                className="form-input"
                type="date"
                name="data_fim"
                value={form.data_fim}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Origem */}
          <div className={styles.grid2}>
            <div className="form-group">
              <label className="form-label">Origem do RH *</label>
              <select
                className="form-input"
                name="origem_rh"
                value={form.origem_rh}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {ORIGEM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {formErrors.origem_rh && (
                <span className="form-error">{formErrors.origem_rh}</span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/projetos/${id_projeto}`)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSalvando}>
              {isSalvando ? 'Salvando...' : 'Incluir Membro'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
