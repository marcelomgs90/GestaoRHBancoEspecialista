import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from './MainLayout.module.css'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', roles: ['ADMINISTRADOR', 'COORDENADOR', 'GESTOR_POLO', 'APOIO_COORDENADOR'] },
  { path: '/solicitacoes', label: 'Solicitacoes', roles: ['ADMINISTRADOR', 'COORDENADOR', 'GESTOR_POLO', 'APOIO_COORDENADOR'] },
  { path: '/projetos', label: 'Projetos', roles: ['ADMINISTRADOR', 'COORDENADOR', 'GESTOR_POLO'] },
  { path: '/parametros', label: 'Parametros', roles: ['ADMINISTRADOR'] },
]

export function MainLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const visibleMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.perfil)
  )

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Gestao RH</h2>
          <span>Banco de Especialistas</span>
        </div>

        <nav className={styles.nav}>
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.user}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.nome}</span>
            <span className={styles.userRole}>{user?.perfil}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
