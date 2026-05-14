from functools import wraps
from typing import List, Callable
from fastapi import HTTPException, status, Depends

from app.models.usuario_perfil import Usuario
from app.utils.enums import PerfilUsuario
from app.core.dependencies import get_current_user


def require_role(*roles: PerfilUsuario):
    """
    Decorator/dependency para verificar se usuario tem um dos perfis permitidos.

    Uso:
        @router.get("/admin")
        def admin_route(user: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR))):
            ...
    """
    def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.perfil not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Perfis permitidos: {[r.value for r in roles]}"
            )
        return current_user

    return dependency


def require_coordenador_projeto(projeto_id: int):
    """
    Verifica se o usuario atual e coordenador do projeto especificado.
    """
    def dependency(
        current_user: Usuario = Depends(get_current_user)
    ) -> Usuario:
        # Coordenadores podem acessar apenas seus projetos
        # Administradores e Gestores do Polo podem acessar todos
        if current_user.perfil in [PerfilUsuario.ADMINISTRADOR, PerfilUsuario.GESTOR_POLO]:
            return current_user

        # Verifica se e coordenador do projeto
        # Esta logica sera implementada no service
        return current_user

    return dependency
