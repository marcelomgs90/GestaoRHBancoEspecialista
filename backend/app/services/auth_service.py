from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, hash_invite_token, verify_password
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

        if not user.senha_definida:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Primeiro acesso pendente. Defina sua senha pelo link de convite.",
            )

        if not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário inativo",
            )

        return user

    def gerar_token(self, user: Usuario) -> str:
        return create_access_token(
            data={"sub": str(user.id), "perfil": user.perfil.value}
        )

    def validar_convite(self, token: str) -> Usuario:
        usuario = (
            self.db.query(Usuario)
            .filter(Usuario.convite_token_hash == hash_invite_token(token))
            .first()
        )
        if not usuario or usuario.senha_definida or not usuario.convite_expira_em:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite invalido ou ja utilizado",
            )

        if usuario.convite_expira_em < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Convite expirado",
            )

        if not usuario.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario inativo",
            )

        return usuario

    def definir_senha_por_convite(self, token: str, senha: str) -> Usuario:
        usuario = self.validar_convite(token)
        usuario.senha_hash = get_password_hash(senha)
        usuario.senha_definida = True
        usuario.convite_token_hash = None
        usuario.convite_expira_em = None
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
