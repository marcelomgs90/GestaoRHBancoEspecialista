import { useAuth } from '../../contexts/AuthContext'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Bem-vindo(a), {user?.nome}</p>
      </header>

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Projetos Ativos</h3>
          <span className={styles.number}>1</span>
        </div>

        <div className={styles.card}>
          <h3>Solicitacoes Pendentes</h3>
          <span className={styles.number}>0</span>
        </div>

        <div className={styles.card}>
          <h3>Pesquisadores Vinculados</h3>
          <span className={styles.number}>3</span>
        </div>

        <div className={styles.card}>
          <h3>Transferencias Pendentes</h3>
          <span className={styles.number}>0</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2>Acoes Rapidas</h2>
        <div className={styles.actions}>
          <button className="btn btn-primary">Nova Solicitacao de RH</button>
          <button className="btn btn-secondary">Ver Projetos</button>
        </div>
      </section>
    </div>
  )
}
