import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { PerfilUsuario } from '@/types/auth';
import type { ReactNode } from 'react';

interface RoleRouteProps {
  allowedRoles: PerfilUsuario[];
  /** Quando informado, renderiza o filho diretamente. Caso contrario, usa `<Outlet />`. */
  children?: ReactNode;
  /** Para onde redirecionar quando o perfil nao autoriza. Default: `/dashboard`. */
  redirectTo?: string;
}

export function RoleRoute({ allowedRoles, children, redirectTo = '/dashboard' }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || !allowedRoles.includes(user.perfil)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
