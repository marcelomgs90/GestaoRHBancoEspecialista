from app.core.dependencies import get_auth_service, get_current_user
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.models.usuario_perfil import Usuario
from app.services.auth_service import AuthService
from app.schemas.auth import (
    ConvitePrimeiroAcessoResponse,
    DefinirSenhaRequest,
    DefinirSenhaResponse,
    TokenResponse,
    UsuarioResponse,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    user = auth_service.login(form_data.username, form_data.password)
    access_token = auth_service.gerar_token(user)

    return TokenResponse(access_token=access_token)


@router.get("/convites/{token}", response_model=ConvitePrimeiroAcessoResponse)
def validar_convite_primeiro_acesso(
    token: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    usuario = auth_service.validar_convite(token)
    return ConvitePrimeiroAcessoResponse(
        valido=True,
        nome=usuario.nome,
        email=usuario.email,
        expira_em=usuario.convite_expira_em,
    )


@router.post("/convites/{token}/definir-senha", response_model=DefinirSenhaResponse)
def definir_senha_primeiro_acesso(
    token: str,
    dados: DefinirSenhaRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    auth_service.definir_senha_por_convite(token, dados.senha)
    return DefinirSenhaResponse(message="Senha definida com sucesso")


@router.post("/logout")
def logout(current_user: Usuario = Depends(get_current_user)):
    """
    Invalidar sessão do usuário (client-side token removal).

    Nota: JWT e stateless, entao o logout real acontece no cliente
    removendo o token. Este endpoint existe para consistencia da API.
    """
    return {"message": "Logout realizado com sucesso"}


@router.get("/usuario-logado", response_model=UsuarioResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Retornar dados do usuário autenticado."""
    return current_user
