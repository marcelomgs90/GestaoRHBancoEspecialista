import { useState, useEffect } from 'react'
import { solicitacaoService } from '../../services/solicitacaoService'
import { projetoService } from '../../services/projetoService'
import { Solicitacao, SolicitacaoCreate, Membro } from '../../types/solicitacao'
import { Projeto } from '../../types/projeto'
import { TipoSolicitacao, STATUS_SOLICITACAO_LABELS, TIPO_SOLICITACAO_LABELS } from '../../types/enums'
import { formatDate, formatCurrency, CATEGORIA_BOLSA_LABELS, getAvatarColor } from '../../types/projeto'
import styles from './SolicitacoesListPage.module.css'

const TIPO_OPTIONS = [
  { value: TipoSolicitacao.IMPLANTACAO, label: 'Implantação' },
  { value: TipoSolicitacao.ALTERACAO, label: 'Alteração' },
]

interface NovaForm {
  identificador: string
  projeto_id: string
  tipo: string
  justificativa: string
  mes_ano_referencia: string
}

type NovaFormErrors = Partial<Record<keyof NovaForm, string>>

const NOVA_FORM_VAZIO: NovaForm = {
  identificador: '',
  projeto_id: '',
  tipo: '',
  justificativa: '',
  mes_ano_referencia: '',
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'APROVADA': return 'badge-success'
    case 'EM_EDICAO': return 'badge-warning'
    case 'REJEITADA': return 'badge-danger'
    default: return 'badge-info'
  }
}

export function SolicitacoesListPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal Nova Solicitação
  const [isNovaOpen, setIsNovaOpen] = useState(false)
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [isLoadingProjetos, setIsLoadingProjetos] = useState(false)
  const [novaForm, setNovaForm] = useState<NovaForm>(NOVA_FORM_VAZIO)
  const [novaFormErrors, setNovaFormErrors] = useState<NovaFormErrors>({})
  const [isSalvandoNova, setIsSalvandoNova] = useState(false)
  const [novaError, setNovaError] = useState('')

  // Modal Ver Solicitação
  const [isVerOpen, setIsVerOpen] = useState(false)
  const [solicitacaoVer, setSolicitacaoVer] = useState<Solicitacao | null>(null)
  const [membrosVer, setMembrosVer] = useState<Membro[]>([])
  const [isLoadingVer, setIsLoadingVer] = useState(false)
  const [verError, setVerError] = useState('')

  useEffect(() => {
    loadSolicitacoes()
  }, [])

  async function loadSolicitacoes() {
    try {
      const data = await solicitacaoService.listar()
      setSolicitacoes(data)
    } catch {
      setError('Erro ao carregar solicitações')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Modal Nova ---

  async function abrirNova() {
    setNovaForm(NOVA_FORM_VAZIO)
    setNovaFormErrors({})
    setNovaError('')
    setIsNovaOpen(true)
    setIsLoadingProjetos(true)
    try {
      const data = await projetoService.listar()
      setProjetos(data.filter((p) => p.status === 'ATIVO'))
    } catch {
      setNovaError('Erro ao carregar projetos.')
    } finally {
      setIsLoadingProjetos(false)
    }
  }

  function fecharNova() {
    setIsNovaOpen(false)
  }

  function handleNovaChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setNovaForm((prev) => ({ ...prev, [name]: value }))
    setNovaFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validarNova(): boolean {
    const erros: NovaFormErrors = {}
    if (!novaForm.identificador.trim()) erros.identificador = 'Campo obrigatório'
    if (!novaForm.projeto_id) erros.projeto_id = 'Selecione um projeto'
    if (!novaForm.tipo) erros.tipo = 'Selecione o tipo'
    if (!novaForm.justificativa.trim()) erros.justificativa = 'Campo obrigatório'
    if (!novaForm.mes_ano_referencia.trim()) erros.mes_ano_referencia = 'Campo obrigatório'
    setNovaFormErrors(erros)
    return Object.keys(erros).length === 0
  }

  async function handleNovaSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validarNova()) return

    setIsSalvandoNova(true)
    setNovaError('')
    try {
      const payload: SolicitacaoCreate = {
        identificador: novaForm.identificador,
        projeto_id: Number(novaForm.projeto_id),
        tipo: novaForm.tipo as TipoSolicitacao,
        justificativa: novaForm.justificativa,
        mes_ano_referencia: novaForm.mes_ano_referencia,
      }
      await solicitacaoService.criar(payload)
      fecharNova()
      await loadSolicitacoes()
    } catch {
      setNovaError('Erro ao criar solicitação. Verifique os dados.')
    } finally {
      setIsSalvandoNova(false)
    }
  }

  // --- Modal Ver ---

  async function abrirVer(sol: Solicitacao) {
    setIsVerOpen(true)
    setSolicitacaoVer(sol)
    setMembrosVer([])
    setVerError('')
    setIsLoadingVer(true)
    try {
      const [solDetail, membros] = await Promise.all([
        solicitacaoService.obter(sol.id),
        solicitacaoService.listarMembros(sol.id),
      ])
      setSolicitacaoVer(solDetail)
      setMembrosVer(membros)
    } catch {
      setVerError('Erro ao carregar detalhes da solicitação.')
    } finally {
      setIsLoadingVer(false)
    }
  }

  function fecharVer() {
    setIsVerOpen(false)
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Solicitações de RH</h1>
          <p>Gerencie as solicitações de implantação, alteração e pagamento</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNova}>Nova Solicitação</button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className="table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Projeto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Nenhuma solicitação encontrada
                </td>
              </tr>
            ) : (
              solicitacoes.map((sol) => (
                <tr key={sol.id}>
                  <td>{sol.identificador}</td>
                  <td>{TIPO_SOLICITACAO_LABELS[sol.tipo]}</td>
                  <td>
                    <span className={`badge ${getStatusClass(sol.status)}`}>
                      {STATUS_SOLICITACAO_LABELS[sol.status]}
                    </span>
                  </td>
                  <td>Projeto #{sol.projeto_id}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => abrirVer(sol)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Solicitação */}
      {isNovaOpen && (
        <div className={styles.modalOverlay} onClick={fecharNova}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nova Solicitação</h2>
              <button className={styles.modalCloseBtn} type="button" onClick={fecharNova}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleNovaSave}>
              <div className={styles.modalBody}>
                {novaError && <div className={styles.modalError}>{novaError}</div>}

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Identificador *</label>
                    <input
                      className="form-input"
                      name="identificador"
                      value={novaForm.identificador}
                      onChange={handleNovaChange}
                      placeholder="Ex: IMPL-2026-001"
                    />
                    {novaFormErrors.identificador && (
                      <span className="form-error">{novaFormErrors.identificador}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mês/Ano de Referência *</label>
                    <input
                      className="form-input"
                      name="mes_ano_referencia"
                      value={novaForm.mes_ano_referencia}
                      onChange={handleNovaChange}
                      placeholder="MM/YYYY"
                    />
                    {novaFormErrors.mes_ano_referencia && (
                      <span className="form-error">{novaFormErrors.mes_ano_referencia}</span>
                    )}
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Projeto *</label>
                    {isLoadingProjetos ? (
                      <p className={styles.loadingInline}>Carregando projetos...</p>
                    ) : (
                      <select
                        className="form-input"
                        name="projeto_id"
                        value={novaForm.projeto_id}
                        onChange={handleNovaChange}
                      >
                        <option value="">Selecione...</option>
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo} — {p.titulo}
                          </option>
                        ))}
                      </select>
                    )}
                    {novaFormErrors.projeto_id && (
                      <span className="form-error">{novaFormErrors.projeto_id}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-input"
                      name="tipo"
                      value={novaForm.tipo}
                      onChange={handleNovaChange}
                    >
                      <option value="">Selecione...</option>
                      {TIPO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {novaFormErrors.tipo && (
                      <span className="form-error">{novaFormErrors.tipo}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Justificativa *</label>
                  <textarea
                    className="form-input"
                    name="justificativa"
                    value={novaForm.justificativa}
                    onChange={handleNovaChange}
                    placeholder="Descreva a justificativa para esta solicitação"
                    rows={3}
                  />
                  {novaFormErrors.justificativa && (
                    <span className="form-error">{novaFormErrors.justificativa}</span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={fecharNova}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSalvandoNova}>
                  {isSalvandoNova ? 'Salvando...' : 'Criar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Solicitação */}
      {isVerOpen && solicitacaoVer && (
        <div className={styles.modalOverlay} onClick={fecharVer}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{solicitacaoVer.identificador}</h2>
              <button className={styles.modalCloseBtn} type="button" onClick={fecharVer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              {verError && <div className={styles.modalError}>{verError}</div>}

              {/* Dados da solicitação */}
              <div className={styles.verGrid}>
                <div>
                  <div className={styles.verLabel}>Tipo</div>
                  <div className={styles.verValue}>{TIPO_SOLICITACAO_LABELS[solicitacaoVer.tipo]}</div>
                </div>
                <div>
                  <div className={styles.verLabel}>Status</div>
                  <div className={styles.verValue}>
                    <span className={`badge ${getStatusClass(solicitacaoVer.status)}`}>
                      {STATUS_SOLICITACAO_LABELS[solicitacaoVer.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className={styles.verLabel}>Projeto</div>
                  <div className={styles.verValue}>Projeto #{solicitacaoVer.projeto_id}</div>
                </div>
                <div>
                  <div className={styles.verLabel}>Mês/Ano Ref.</div>
                  <div className={styles.verValue}>{solicitacaoVer.mes_ano_referencia || '—'}</div>
                </div>
              </div>

              {solicitacaoVer.justificativa && (
                <div className={styles.verJustificativa}>
                  <div className={styles.verLabel}>Justificativa</div>
                  <p className={styles.verJustificativaText}>{solicitacaoVer.justificativa}</p>
                </div>
              )}

              <hr className={styles.verDivider} />

              {/* Membros */}
              <div className={styles.verMembrosTitle}>Membros da Solicitação</div>

              {isLoadingVer ? (
                <div className={styles.loadingInline}>Carregando membros...</div>
              ) : membrosVer.length === 0 ? (
                <div className={styles.verEmpty}>Nenhum membro nesta solicitação.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pesquisador</th>
                      <th>Categoria</th>
                      <th>Fonte</th>
                      <th>Carga (h)</th>
                      <th>Período</th>
                      <th>Bolsa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membrosVer.map((membro) => {
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
                            <div>{categoriaInfo?.funcao ?? membro.categoria_bolsa}</div>
                            <span className="badge badge-info">{categoriaInfo?.nivel ?? '—'}</span>
                          </td>
                          <td>{membro.fonte_financiamento}</td>
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

            <div className={styles.modalFooter}>
              <button type="button" className="btn btn-secondary" onClick={fecharVer}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
