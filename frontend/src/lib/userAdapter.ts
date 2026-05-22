import { User, UserRole } from '@/types/legacy';
import { PerfilUsuario, Usuario } from '@/types/auth';

/**
 * Adapta o `Usuario` real (vindo do backend via AuthContext) para o tipo `User`
 * do prototipo legacy. Usado nas paginas ainda nao migradas (Etapa 6).
 *
 * Mapeamento de perfil:
 *   ADMINISTRADOR, GESTOR_POLO → UserRole.GESTOR (visao ampla, pode tudo no mock)
 *   COORDENADOR, APOIO_COORDENADOR → UserRole.COORDENADOR (visao escopada no mock)
 */
const ROLE_MAP: Record<PerfilUsuario, UserRole> = {
  [PerfilUsuario.ADMINISTRADOR]: UserRole.GESTOR,
  [PerfilUsuario.GESTOR_POLO]: UserRole.GESTOR,
  [PerfilUsuario.COORDENADOR]: UserRole.COORDENADOR,
  [PerfilUsuario.APOIO_COORDENADOR]: UserRole.COORDENADOR,
};

export function adaptUsuarioToLegacy(u: Usuario): User {
  return {
    id: String(u.id),
    name: u.nome,
    email: u.email,
    role: ROLE_MAP[u.perfil],
    isServidor: true,
  };
}
