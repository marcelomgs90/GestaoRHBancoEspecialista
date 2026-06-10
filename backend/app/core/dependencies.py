from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, EspecialistasSessionLocal
from app.core.security import decode_access_token
from app.models.usuario_perfil import Usuario
from app.services.auth_service import AuthService
from app.services.membro_service import MembroService
from app.services.parametro_service import ParametroService
from app.services.projeto_service import ProjetoService
from app.services.solicitacao_service import SolicitacaoService
from app.services.usuario_service import UsuarioService
from app.services.versao_service import VersaoService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db() -> Generator[Session, None, None]:
    """Dependency para obter sessão do banco de dados."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_especialistas_db() -> Generator[Session, None, None]:
    """Dependency para obter sessão do banco de especialistas externo."""
    db = EspecialistasSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Usuario:
    """Obtém usuário atual a partir do token JWT."""
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo",
        )

    return user


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_usuario_service(db: Session = Depends(get_db)) -> UsuarioService:
    return UsuarioService(db)


def get_projeto_service(db: Session = Depends(get_db)) -> ProjetoService:
    return ProjetoService(db)


def get_solicitacao_service(db: Session = Depends(get_db)) -> SolicitacaoService:
    return SolicitacaoService(db)


def get_membro_service(db: Session = Depends(get_db)) -> MembroService:
    return MembroService(db)


def get_versao_service(db: Session = Depends(get_db)) -> VersaoService:
    return VersaoService(db)


def get_parametro_service(db: Session = Depends(get_db)) -> ParametroService:
    return ParametroService(db)