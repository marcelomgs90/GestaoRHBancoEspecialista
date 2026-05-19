import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projetoService } from '../../services/projetoService'
import { Projeto, getYear } from '../../types/projeto'
import styles from './ProjetosListPage.module.css'

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

export function ProjetosListPage() {
  const navigate = useNavigate()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

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
        <button className="btn btn-primary">+ Novo Projeto</button>
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
                      {projeto.status === 'ATIVO' ? 'Ativo' : projeto.status}
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
    </div>
  )
}
