import { useState, useEffect } from 'react'
import { solicitacaoService } from '../../services/solicitacaoService'
import { Solicitacao } from '../../types/solicitacao'
import { STATUS_SOLICITACAO_LABELS, TIPO_SOLICITACAO_LABELS } from '../../types/enums'
import styles from './SolicitacoesListPage.module.css'

export function SolicitacoesListPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSolicitacoes()
  }, [])

  async function loadSolicitacoes() {
    try {
      const data = await solicitacaoService.listar()
      setSolicitacoes(data)
    } catch {
      setError('Erro ao carregar solicitacoes')
    } finally {
      setIsLoading(false)
    }
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'APROVADA':
        return 'badge-success'
      case 'EM_EDICAO':
        return 'badge-warning'
      case 'REJEITADA':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Solicitacoes de RH</h1>
          <p>Gerencie as solicitacoes de implantacao, alteracao e pagamento</p>
        </div>
        <button className="btn btn-primary">Nova Solicitacao</button>
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
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Nenhuma solicitacao encontrada
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
                    <button className="btn btn-secondary">Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
