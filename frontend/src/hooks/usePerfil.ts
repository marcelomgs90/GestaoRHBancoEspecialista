import { useAuth } from '@/contexts/AuthContext';
import { PerfilUsuario } from '@/types/auth';

/**
 * Matriz de permissoes por perfil. Centraliza decisoes de UI/RBAC
 * para evitar comparacoes espalhadas com `user.perfil === ...`.
 */
export function usePerfil() {
  const { user } = useAuth();
  const perfil = user?.perfil ?? null;

  const is = (...perfis: PerfilUsuario[]) => (perfil ? perfis.includes(perfil) : false);

  return {
    perfil,
    is,
    isAdministrador: perfil === PerfilUsuario.ADMINISTRADOR,
    isCoordenador: perfil === PerfilUsuario.COORDENADOR,
    isGestorPolo: perfil === PerfilUsuario.GESTOR_POLO,
    isApoioCoordenador: perfil === PerfilUsuario.APOIO_COORDENADOR,

    podeCriarProjeto: is(PerfilUsuario.COORDENADOR, PerfilUsuario.ADMINISTRADOR),
    podeAprovarSolicitacao: is(PerfilUsuario.GESTOR_POLO, PerfilUsuario.ADMINISTRADOR),
    podeEditarMembros: is(PerfilUsuario.COORDENADOR, PerfilUsuario.ADMINISTRADOR),
    podeGerenciarParametros: is(PerfilUsuario.ADMINISTRADOR),
  };
}
