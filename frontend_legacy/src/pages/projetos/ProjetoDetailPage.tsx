import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projetoService } from '../../services/projetoService'
import { solicitacaoService } from '../../services/solicitacaoService'
import {
  Projeto, VersaoRHProjeto, formatDate, formatCurrency,
  CATEGORIA_BOLSA_LABELS, getAvatarColor,
} from '../../types/projeto'
import { Membro, Solicitacao } from '../../types/solicitacao'
import styles from './ProjetoDetailPage.module.css'

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
  { value: 'EMBRAPII', label: 'EMBRAPII' },
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'SEBRAE', label: 'SEBRAE' },
  { value: 'IFPB', label: 'IFPB' },
]

const ORIGEM_OPTIONS = [
  { value: 'Banco de Especialistas', label: 'Banco de Especialistas' },
  { value: 'Processo Seletivo', label: 'Processo Seletivo' },
]

interface MembroForm {
  nome_pesquisador: string
  ref_pesquisador: string
  categoria_bolsa: string
  fonte_financiamento: string
  carga_horaria_semanal: string
  data_inicio: string
  data_fim: string
  origem_rh: string
  solicitacao_id: string
}

type MembroFormErrors = Partial<Record<keyof MembroForm, string>>

const FORM_VAZIO: MembroForm = {
  nome_pesquisador: '',
  ref_pesquisador: '',
  categoria_bolsa: '',
  fonte_financiamento: '',
  carga_horaria_semanal: '',
  data_inicio: '',
  data_fim: '',
  origem_rh: '',
  solicitacao_id: '',
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'ATIVO': return 'badge-success'
    case 'ENCERRADO': return 'badge-danger'
    case 'SUSPENSO': return 'badge-warning'
    default: return 'badge-info'
  }
}

export function ProjetoDetailPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>()
  const navigate = useNavigate()

  // Dados da página
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [versoes, setVersoes] = useState<VersaoRHProjeto[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [solicitacoesDisponiveis, setSolicitacoesDisponiveis] = useState<Solicitacao[]>([])
  const [isLoadingSol, setIsLoadingSol] = useState(false)
  const [isSalvando, setIsSalvando] = useState(false)
  const [modalForm, setModalForm] = useState<MembroForm>(FORM_VAZIO)
  const [modalFormErrors, setModalFormErrors] = useState<MembroFormErrors>({})
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    if (id_projeto) loadProjeto(Number(id_projeto))
  }, [id_projeto])

  async function loadProjeto(id: number) {
    try {
      const [projetoData, versoesData, solicitacoes] = await Promise.all([
        projetoService.obter(id),
        projetoService.listarVersoes(id),
        solicitacaoService.listar(id),
      ])
      setProjeto(projetoData)
      setVersoes(versoesData)

      if (solicitacoes.length > 0) {
        const aprovada = solicitacoes.find((s) => s.status === 'APROVADA') ?? solicitacoes[0]
        const membrosData = await solicitacaoService.listarMembros(aprovada.id)
        setMembros(membrosData)
      }
    } catch {
      setError('Erro ao carregar projeto')
    } finally {
      setIsLoading(false)
    }
  }

  async function abrirModal() {
    setIsModalOpen(true)
    setModalForm(FORM_VAZIO)
    setModalFormErrors({})
    setModalError('')
    setIsLoadingSol(true)
    try {
      const sols = await solicitacaoService.listar(Number(id_projeto))
      setSolicitacoesDisponiveis(sols)
    } catch {
      setModalError('Erro ao carregar solicitações.')
    } finally {
      setIsLoadingSol(false)
    }
  }

  function fecharModal() {
    setIsModalOpen(false)
  }

  function handleModalChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setModalForm((prev) => ({ ...prev, [name]: value }))
    setModalFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validarModal(): boolean {
    const erros: MembroFormErrors = {}
    if (!modalForm.nome_pesquisador.trim()) erros.nome_pesquisador = 'Campo obrigatório'
    if (!modalForm.ref_pesquisador.trim()) erros.ref_pesquisador = 'Campo obrigatório'
    if (!modalForm.categoria_bolsa) erros.categoria_bolsa = 'Selecione uma categoria'
    if (!modalForm.fonte_financiamento) erros.fonte_financiamento = 'Selecione uma fonte'
    if (!modalForm.carga_horaria_semanal) erros.carga_horaria_semanal = 'Campo obrigatório'
    if (!modalForm.data_inicio) erros.data_inicio = 'Campo obrigatório'
    if (!modalForm.origem_rh) erros.origem_rh = 'Selecione a origem'
    if (!modalForm.solicitacao_id) erros.solicitacao_id = 'Selecione uma solicitação'
    setModalFormErrors(erros)
    return Object.keys(erros).length === 0
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validarModal()) return

    setIsSalvando(true)
    setModalError('')
    try {
      await solicitacaoService.incluirMembro(Number(modalForm.solicitacao_id), {
        nome_pesquisador: modalForm.nome_pesquisador,
        ref_pesquisador: modalForm.ref_pesquisador,
        categoria_bolsa: modalForm.categoria_bolsa as any,
        fonte_financiamento: modalForm.fonte_financiamento as any,
        carga_horaria_semanal: Number(modalForm.carga_horaria_semanal),
        data_inicio: modalForm.data_inicio,
        data_fim: modalForm.data_fim || undefined,
        origem_rh: modalForm.origem_rh,
      })
      fecharModal()
      setSuccessMessage('Membro incluído com sucesso!')
      loadProjeto(Number(id_projeto))
    } catch {
      setModalError('Erro ao incluir membro. Verifique os dados e tente novamente.')
    } finally {
      setIsSalvando(false)
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando projeto...</div>
  }

  if (error || !projeto) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBlock}>{error || 'Projeto não encontrado.'}</div>
      </div>
    )
  }

  const temImplantacao = versoes.length > 0
  const idAbreviado = projeto.codigo.replace('PROJ-', '')

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/projetos')}>
        ← Projetos
      </button>

      {successMessage && (
        <div className={styles.successBanner}>
          {successMessage}
        </div>
      )}

      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <span className={styles.idChip}>
          <span className={styles.idChipLabel}>ID:</span>
          {idAbreviado}
        </span>
        <span className={styles.headerCodigo}>{projeto.codigo}</span>
        <button className={styles.editBtn} title="Editar projeto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <h1 className={styles.titulo}>{projeto.titulo}</h1>
      {projeto.descricao && <p className={styles.descricao}>{projeto.descricao}</p>}

      {/* Metadados */}
      <div className={styles.metaRow}>
        <div>
          <div className={styles.metaLabel}>Código</div>
          <div className={styles.metaValue}>{projeto.codigo}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Status</div>
          <div className={styles.metaValue}>
            <span className={`badge ${getStatusClass(projeto.status)}`}>
              {projeto.status === 'ATIVO' ? 'Ativo' : projeto.status}
            </span>
          </div>
        </div>
        <div>
          <div className={styles.metaLabel}>Início</div>
          <div className={styles.metaValue}>{formatDate(projeto.data_inicio)}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Fim</div>
          <div className={styles.metaValue}>{formatDate(projeto.data_fim)}</div>
        </div>
      </div>

      {/* Recursos Humanos */}
      <div className={styles.rhSection}>
        <div className={styles.rhHeader}>
          <div className={styles.rhTitle}>
            <span className={styles.rhTitleText}>Recursos Humanos</span>
            <span className={styles.rhCount}>
              {membros.length} pesquisador{membros.length !== 1 ? 'es' : ''} alocado{membros.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.rhActions}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/projetos/${id_projeto}/implantacao`)}
            >
              + Implantação
            </button>

            <span
              title={!temImplantacao ? 'Deve ser feita a primeira Implantação' : undefined}
              className={!temImplantacao ? styles.disabledWrapper : undefined}
            >
              <button
                className="btn btn-primary"
                disabled={!temImplantacao}
                style={{ pointerEvents: !temImplantacao ? 'none' : undefined }}
                onClick={abrirModal}
              >
                ✎ Modificação
              </button>
            </span>
          </div>
        </div>

        {membros.length === 0 ? (
          <div className={styles.rhEmpty}>Nenhum pesquisador alocado neste projeto.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pesquisador</th>
                <th>Função / Nível</th>
                <th>Carga (h)</th>
                <th>Período</th>
                <th>Bolsa Mensal</th>
              </tr>
            </thead>
            <tbody>
              {membros.map((membro) => {
                const categoriaInfo = CATEGORIA_BOLSA_LABELS[membro.categoria_bolsa]
                const avatarColor = getAvatarColor(membro.nome_pesquisador)
                const inicial = membro.nome_pesquisador.charAt(0).toUpperCase()
                return (
                  <tr key={membro.id}>
                    <td>
                      <div className={styles.pesquisadorCell}>
                        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
                          {inicial}
                        </div>
                        <div>
                          <div className={styles.pesquisadorName}>{membro.nome_pesquisador}</div>
                          <div className={styles.pesquisadorRef}>{membro.ref_pesquisador}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.funcaoNome}>{categoriaInfo?.funcao ?? membro.categoria_bolsa}</div>
                      <span className="badge badge-info">{categoriaInfo?.nivel ?? '—'}</span>
                    </td>
                    <td>{membro.carga_horaria_semanal}h</td>
                    <td className={styles.periodoValue}>
                      {formatDate(membro.data_inicio)}
                      {membro.data_fim ? ` — ${formatDate(membro.data_fim)}` : ' — em aberto'}
                    </td>
                    <td className={styles.bolsaValue}>{formatCurrency(membro.valor_bolsa)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Modificação */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h2>Incluir Membro</h2>
              <button className={styles.modalCloseBtn} onClick={fecharModal} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className={styles.modalBody}>
                {modalError && <div className={styles.modalError}>{modalError}</div>}

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Nome do Pesquisador *</label>
                    <input
                      className="form-input"
                      name="nome_pesquisador"
                      value={modalForm.nome_pesquisador}
                      onChange={handleModalChange}
                      placeholder="Nome completo"
                    />
                    {modalFormErrors.nome_pesquisador && (
                      <span className="form-error">{modalFormErrors.nome_pesquisador}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Referência / Matrícula *</label>
                    <input
                      className="form-input"
                      name="ref_pesquisador"
                      value={modalForm.ref_pesquisador}
                      onChange={handleModalChange}
                      placeholder="Ex: LJ001"
                    />
                    {modalFormErrors.ref_pesquisador && (
                      <span className="form-error">{modalFormErrors.ref_pesquisador}</span>
                    )}
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Categoria da Bolsa *</label>
                    <select
                      className="form-input"
                      name="categoria_bolsa"
                      value={modalForm.categoria_bolsa}
                      onChange={handleModalChange}
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {modalFormErrors.categoria_bolsa && (
                      <span className="form-error">{modalFormErrors.categoria_bolsa}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fonte de Financiamento *</label>
                    <select
                      className="form-input"
                      name="fonte_financiamento"
                      value={modalForm.fonte_financiamento}
                      onChange={handleModalChange}
                    >
                      <option value="">Selecione...</option>
                      {FONTES_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {modalFormErrors.fonte_financiamento && (
                      <span className="form-error">{modalFormErrors.fonte_financiamento}</span>
                    )}
                  </div>
                </div>

                <div className={styles.grid3}>
                  <div className="form-group">
                    <label className="form-label">Carga Horária Semanal (h) *</label>
                    <input
                      className="form-input"
                      type="number"
                      name="carga_horaria_semanal"
                      value={modalForm.carga_horaria_semanal}
                      onChange={handleModalChange}
                      placeholder="Ex: 40"
                      min="1"
                      max="40"
                    />
                    {modalFormErrors.carga_horaria_semanal && (
                      <span className="form-error">{modalFormErrors.carga_horaria_semanal}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Início *</label>
                    <input
                      className="form-input"
                      type="date"
                      name="data_inicio"
                      value={modalForm.data_inicio}
                      onChange={handleModalChange}
                    />
                    {modalFormErrors.data_inicio && (
                      <span className="form-error">{modalFormErrors.data_inicio}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Fim</label>
                    <input
                      className="form-input"
                      type="date"
                      name="data_fim"
                      value={modalForm.data_fim}
                      onChange={handleModalChange}
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Origem do RH *</label>
                    <select
                      className="form-input"
                      name="origem_rh"
                      value={modalForm.origem_rh}
                      onChange={handleModalChange}
                    >
                      <option value="">Selecione...</option>
                      {ORIGEM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {modalFormErrors.origem_rh && (
                      <span className="form-error">{modalFormErrors.origem_rh}</span>
                    )}
                  </div>
                </div>

                <div className={styles.solicitacaoDivider} />

                <div className="form-group">
                  <label className="form-label">Solicitação *</label>
                  {isLoadingSol ? (
                    <p className={styles.loadingSol}>Carregando solicitações...</p>
                  ) : solicitacoesDisponiveis.length === 0 ? (
                    <p className={styles.emptySol}>Nenhuma solicitação disponível para este projeto.</p>
                  ) : (
                    <select
                      className="form-input"
                      name="solicitacao_id"
                      value={modalForm.solicitacao_id}
                      onChange={handleModalChange}
                    >
                      <option value="">Selecione uma solicitação...</option>
                      {solicitacoesDisponiveis.map((sol) => (
                        <option key={sol.id} value={sol.id}>
                          {sol.identificador} — {sol.tipo} — {sol.status}
                        </option>
                      ))}
                    </select>
                  )}
                  {modalFormErrors.solicitacao_id && (
                    <span className="form-error">{modalFormErrors.solicitacao_id}</span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSalvando}>
                  {isSalvando ? 'Salvando...' : 'Incluir Membro'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
