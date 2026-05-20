import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projetoService } from '../../services/projetoService'
import { Projeto, ProjetoCreate, getYear } from '../../types/projeto'
import styles from './ProjetosListPage.module.css'

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

interface NovoForm {
  codigo: string
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  status: string
}

type NovoFormErrors = Partial<Record<keyof NovoForm, string>>

const FORM_VAZIO: NovoForm = {
  codigo: '',
  titulo: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  status: 'ATIVO',
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'ATIVO': return 'badge-success'
    case 'FINALIZADO': return 'badge-danger'
    case 'SUSPENSO': return 'badge-warning'
    default: return 'badge-info'
  }
}

export function ProjetosListPage() {
  const navigate = useNavigate()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<NovoForm>(FORM_VAZIO)
  const [formErrors, setFormErrors] = useState<NovoFormErrors>({})
  const [isSalvando, setIsSalvando] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    loadProjetos()
  }, [])

  async function loadProjetos() {
    try {
      const data = await projetoService.listar()
      setProjetos(data)
    } catch {
      setError('Erro ao carregar projetos')
    } finally {
      setIsLoading(false)
    }
  }

  const projetosFiltrados = projetos.filter((p) => {
    const termo = search.toLowerCase()
    return p.codigo.toLowerCase().includes(termo) || p.titulo.toLowerCase().includes(termo)
  })

  function abrirModal() {
    setForm(FORM_VAZIO)
    setFormErrors({})
    setModalError('')
    setIsModalOpen(true)
  }

  function fecharModal() {
    setIsModalOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validar(): boolean {
    const erros: NovoFormErrors = {}
    if (!form.codigo.trim()) erros.codigo = 'Campo obrigatório'
    if (!form.titulo.trim()) erros.titulo = 'Campo obrigatório'
    if (!form.data_inicio) erros.data_inicio = 'Campo obrigatório'
    if (!form.data_fim) erros.data_fim = 'Campo obrigatório'
    if (form.data_inicio && form.data_fim && form.data_fim < form.data_inicio) {
      erros.data_fim = 'Data de fim deve ser posterior à data de início'
    }
    setFormErrors(erros)
    return Object.keys(erros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setIsSalvando(true)
    setModalError('')
    try {
      const payload: ProjetoCreate = {
        codigo: form.codigo,
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        status: form.status,
      }
      await projetoService.criar(payload)
      fecharModal()
      await loadProjetos()
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setModalError(
        typeof detail === 'string' ? detail : 'Erro ao criar projeto. Verifique os dados.'
      )
    } finally {
      setIsSalvando(false)
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando projetos...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Catálogo de Projetos</h1>
        <p>Lista completa de ativos institucionais sob gestão do Polo.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Pesquisar por código ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.spacer} />
        <button className="btn btn-secondary">Filtros</button>
        <button className="btn btn-primary" onClick={abrirModal}>+ Novo Projeto</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {projetosFiltrados.length === 0 && !error ? (
        <div className={styles.empty}>Nenhum projeto encontrado.</div>
      ) : (
        <div className={styles.projectList}>
          {projetosFiltrados.map((projeto) => (
            <div
              key={projeto.id}
              className={styles.projectCard}
              onClick={() => navigate(`/projetos/${projeto.id}`)}
            >
              <div className={styles.cardLeft}>
                <div className={styles.cardHeader}>
                  <span className={`badge ${styles.codeBadge}`}>{projeto.codigo}</span>
                  <span className={styles.cardTitle}>{projeto.titulo}</span>
                </div>
                {projeto.descricao && (
                  <p className={styles.cardDescription}>{projeto.descricao}</p>
                )}
              </div>

              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>Vigência</div>
                  <div className={styles.metaValue}>
                    {getYear(projeto.data_inicio)} — {getYear(projeto.data_fim)}
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>Status</div>
                  <div className={styles.metaValue}>
                    <span className={`badge ${getStatusClass(projeto.status)}`}>
                      {projeto.status === 'ATIVO' ? 'Ativo'
                        : projeto.status === 'SUSPENSO' ? 'Suspenso'
                        : 'Finalizado'}
                    </span>
                  </div>
                </div>
              </div>

              <svg className={styles.cardArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Projeto */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Novo Projeto</h2>
              <button className={styles.modalCloseBtn} type="button" onClick={fecharModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {modalError && <div className={styles.modalError}>{modalError}</div>}

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Código *</label>
                    <input
                      className="form-input"
                      name="codigo"
                      value={form.codigo}
                      onChange={handleChange}
                      placeholder="Ex: PROJ-001"
                    />
                    {formErrors.codigo && <span className="form-error">{formErrors.codigo}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    className="form-input"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Título do projeto"
                  />
                  {formErrors.titulo && <span className="form-error">{formErrors.titulo}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    className="form-input"
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    placeholder="Descrição opcional do projeto"
                    rows={3}
                  />
                </div>

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Data de Início *</label>
                    <input
                      className="form-input"
                      type="date"
                      name="data_inicio"
                      value={form.data_inicio}
                      onChange={handleChange}
                    />
                    {formErrors.data_inicio && <span className="form-error">{formErrors.data_inicio}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Fim *</label>
                    <input
                      className="form-input"
                      type="date"
                      name="data_fim"
                      value={form.data_fim}
                      onChange={handleChange}
                    />
                    {formErrors.data_fim && <span className="form-error">{formErrors.data_fim}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSalvando}>
                  {isSalvando ? 'Salvando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
