import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projetoService } from '../../services/projetoService'
import { solicitacaoService } from '../../services/solicitacaoService'
import { Projeto, formatDate, formatCurrency, CATEGORIA_BOLSA_LABELS, getAvatarColor } from '../../types/projeto'
import { Membro } from '../../types/solicitacao'
import styles from './ProjetoDetailPage.module.css'

function getStatusClass(status: string): string {
  switch (status) {
    case 'ATIVO':
      return 'badge-success'
    case 'ENCERRADO':
      return 'badge-danger'
    case 'SUSPENSO':
      return 'badge-warning'
    default:
      return 'badge-info'
  }
}

export function ProjetoDetailPage() {
  const { id_projeto } = useParams<{ id_projeto: string }>()
  const navigate = useNavigate()

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id_projeto) {
      loadProjeto(Number(id_projeto))
    }
  }, [id_projeto])

  async function loadProjeto(id: number) {
    try {
      const [projetoData, solicitacoes] = await Promise.all([
        projetoService.obter(id),
        solicitacaoService.listar(id),
      ])
      setProjeto(projetoData)

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

  const idAbreviado = projeto.codigo.replace('PROJ-', '')

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/projetos')}>
        ← Projetos
      </button>

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

      {/* Título e descrição */}
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

      {/* Seções laterais */}
      <div className={styles.twoColumnGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>Plano de Financiamento</div>
          <div className={styles.sectionCardBody}>
            <div className={styles.emptySection}>Nenhum financiamento configurado</div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionCardHeader}>Propriedade e Documentação</div>
          <div className={styles.sectionCardBody}>
            <div className={styles.emptySection}>Nenhum documento anexado</div>
          </div>
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
            <button className="btn btn-secondary">+ Implantação</button>
            <button className="btn btn-primary">✎ Modificação</button>
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
    </div>
  )
}
