from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.usuario_perfil import Usuario


class UsuarioService:
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> List[Usuario]:
        return self.db.query(Usuario).all()

    def obter_por_id(self, usuario_id: int) -> Usuario:
        usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario nao encontrado",
            )
        return usuario
