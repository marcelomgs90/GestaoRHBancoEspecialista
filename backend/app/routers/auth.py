from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.security import verify_password, create_access_token
from app.models.usuario_perfil import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autenticar usuario e retornar token JWT.

    - **username**: email do usuario
    - **password**: senha do usuario
    """
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inativo",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "perfil": user.perfil.value}
    )

    return TokenResponse(access_token=access_token)


@router.post("/logout")
def logout(current_user: Usuario = Depends(get_current_user)):
    """
    Invalidar sessao do usuario (client-side token removal).

    Nota: JWT e stateless, entao o logout real acontece no cliente
    removendo o token. Este endpoint existe para consistencia da API.
    """
    return {"message": "Logout realizado com sucesso"}


@router.get("/me", response_model=UsuarioResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Retornar dados do usuario autenticado."""
    return current_user
