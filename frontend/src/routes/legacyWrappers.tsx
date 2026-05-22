/**
 * Wrappers temporarios para as paginas do prototipo (layout_novo) que ainda
 * recebem `user: User` (tipo legacy) como prop. Cada wrapper consome
 * `useAuth()` e injeta o `Usuario` real adaptado.
 *
 * Estes wrappers serao removidos na Etapa 6, quando cada pagina for migrada
 * para consumir `useAuth()` diretamente e usar os tipos reais do backend.
 */
import { useAuth } from '@/contexts/AuthContext';
import { adaptUsuarioToLegacy } from '@/lib/userAdapter';

import Dashboard from '@/pages/Dashboard';
import ProjectList from '@/pages/ProjectList';
import ProjectDetails from '@/pages/ProjectDetails';
import HRRequest from '@/pages/HRRequest';

function withLegacyUser<P extends { user: ReturnType<typeof adaptUsuarioToLegacy> }>(
  Component: React.ComponentType<P>,
) {
  return function LegacyUserWrapper(props: Omit<P, 'user'>) {
    const { user } = useAuth();
    if (!user) return null;
    const legacyUser = adaptUsuarioToLegacy(user);
    return <Component {...(props as P)} user={legacyUser} />;
  };
}

export const DashboardRoute = withLegacyUser(Dashboard);
export const ProjectListRoute = withLegacyUser(ProjectList);
export const ProjectDetailsRoute = withLegacyUser(ProjectDetails);
export const HRRequestRoute = withLegacyUser(HRRequest);
