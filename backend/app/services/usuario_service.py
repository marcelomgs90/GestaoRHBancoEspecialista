from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.usuario_perfil import Usuario
from app.utils.enums import PerfilUsuario


class UsuarioService:
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> List[Usuario]:
        return self.db.query(Usuario).all()

    def listar_coordenadores(
        self,
        termo: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Usuario], int]:
        query = self.db.query(Usuario).filter(
            Usuario.perfil == PerfilUsuario.COORDENADOR,
            Usuario.ativo.is_(True),
        )

        if termo:
            filtro = f"%{termo.strip()}%"
            query = query.filter(
                or_(
                    Usuario.nome.ilike(filtro),
                    Usuario.email.ilike(filtro),
                    Usuario.ref_usuario.ilike(filtro),
                )
            )

        total = query.count()
        items = (
            query.order_by(Usuario.nome.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return items, total

    def obter_por_id(self, usuario_id: int) -> Usuario:
        usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )
        return usuario
