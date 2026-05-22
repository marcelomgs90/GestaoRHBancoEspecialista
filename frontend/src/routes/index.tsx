import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';
import { PerfilUsuario } from '@/types/auth';
import { AppShell } from '@/components/layout/AppShell';

import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProjetosListPage from '@/pages/projetos/ProjetosListPage';
import ProjetoFormPage from '@/pages/projetos/ProjetoFormPage';
import ProjetoDetailPage from '@/pages/projetos/ProjetoDetailPage';
import ImplantacaoPage from '@/pages/projetos/ImplantacaoPage';
import SolicitacoesListPage from '@/pages/solicitacoes/SolicitacoesListPage';
import BolsaManagementPage from '@/pages/parametros/BolsaManagementPage';

const FEATURE_BOLSAS = import.meta.env.VITE_FEATURE_BOLSAS === 'true';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/projetos" element={<ProjetosListPage />} />
          <Route
            path="/projetos/novo"
            element={
              <RoleRoute allowedRoles={[PerfilUsuario.COORDENADOR, PerfilUsuario.ADMINISTRADOR]}>
                <ProjetoFormPage />
              </RoleRoute>
            }
          />
          <Route path="/projetos/:id_projeto" element={<ProjetoDetailPage />} />
          <Route path="/projetos/:id_projeto/implantacao" element={<ImplantacaoPage />} />

          <Route path="/solicitacoes" element={<SolicitacoesListPage />} />

          {FEATURE_BOLSAS && (
            <Route
              path="/parametros/bolsas"
              element={
                <RoleRoute allowedRoles={[PerfilUsuario.ADMINISTRADOR]}>
                  <BolsaManagementPage />
                </RoleRoute>
              }
            />
          )}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
