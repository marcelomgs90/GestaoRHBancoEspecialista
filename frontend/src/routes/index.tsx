import { Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { MainLayout } from '../components/layout/MainLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { SolicitacoesListPage } from '../pages/solicitacoes/SolicitacoesListPage'
import { ProjetosListPage } from '../pages/projetos/ProjetosListPage'
import { ProjetoDetailPage } from '../pages/projetos/ProjetoDetailPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/solicitacoes" element={<SolicitacoesListPage />} />
          <Route path="/projetos" element={<ProjetosListPage />} />
          <Route path="/projetos/:id_projeto" element={<ProjetoDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
