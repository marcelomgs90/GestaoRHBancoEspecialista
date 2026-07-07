import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';
import { PerfilUsuario } from '@/types/auth';
import { AppShell } from '@/components/layout/AppShell';

import LoginPage from '@/pages/auth/LoginPage';
import DefinirSenhaPage from '@/pages/auth/DefinirSenhaPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProjetosListPage from '@/pages/projetos/ProjetosListPage';
import ProjetoFormPage from '@/pages/projetos/ProjetoFormPage';
import ProjetoDetailPage from '@/pages/projetos/ProjetoDetailPage';
import ProjetoEditPage from '@/pages/projetos/ProjetoEditPage';
import ImplantacaoPage from '@/pages/projetos/ImplantacaoPage';
import AlteracaoPage from '@/pages/projetos/AlteracaoPage';
import SolicitacoesListPage from '@/pages/solicitacoes/SolicitacoesListPage';
import SolicitacaoComparacaoPage from '@/pages/solicitacoes/SolicitacaoComparacaoPage';
import BolsaManagementPage from '@/pages/parametros/BolsaManagementPage';

const FEATURE_BOLSAS = import.meta.env.VITE_FEATURE_BOLSAS === 'true';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/definir-senha/:token" element={<DefinirSenhaPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/projetos" element={<ProjetosListPage />} />
          <Route
            path="/projetos/novo"
            element={
              <RoleRoute
                allowedRoles={[
                  PerfilUsuario.COORDENADOR,
                  PerfilUsuario.ADMINISTRADOR,
                  PerfilUsuario.GESTOR_POLO,
                ]}
              >
                <ProjetoFormPage />
              </RoleRoute>
            }
          />
          <Route path="/projetos/:id_projeto" element={<ProjetoDetailPage />} />
          <Route
            path="/projetos/:id_projeto/editar"
            element={
              <RoleRoute
                allowedRoles={[
                  PerfilUsuario.COORDENADOR,
                  PerfilUsuario.ADMINISTRADOR,
                  PerfilUsuario.GESTOR_POLO,
                ]}
              >
                <ProjetoEditPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projetos/:id_projeto/implantacao"
            element={
              <RoleRoute
                allowedRoles={[
                  PerfilUsuario.COORDENADOR,
                  PerfilUsuario.ADMINISTRADOR,
                  PerfilUsuario.APOIO_COORDENADOR,
                ]}
              >
                <ImplantacaoPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projetos/:id_projeto/alteracao"
            element={
              <RoleRoute
                allowedRoles={[
                  PerfilUsuario.COORDENADOR,
                  PerfilUsuario.ADMINISTRADOR,
                  PerfilUsuario.APOIO_COORDENADOR,
                ]}
              >
                <AlteracaoPage />
              </RoleRoute>
            }
          />

          <Route path="/solicitacoes" element={<SolicitacoesListPage />} />
          <Route
            path="/solicitacoes/:id_solicitacao/comparacao"
            element={<SolicitacaoComparacaoPage />}
          />

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
