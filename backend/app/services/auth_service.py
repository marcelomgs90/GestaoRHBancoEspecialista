from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.usuario_perfil import Usuario


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login(self, email: str, senha: str) -> Usuario:
        user = self.db.query(Usuario).filter(Usuario.email == email).first()

        if not user or not verify_password(senha, user.senha_hash):
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

        return user

    def gerar_token(self, user: Usuario) -> str:
        return create_access_token(
            data={"sub": str(user.id), "perfil": user.perfil.value}
        )
