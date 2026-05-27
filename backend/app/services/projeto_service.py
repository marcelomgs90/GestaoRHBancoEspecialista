from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.schemas.projeto import ProjetoCreate
from app.utils.enums import PerfilUsuario, StatusProjeto


class ProjetoService:
    def __init__(self, db: Session):
        self.db = db

    def criar(self, dados: ProjetoCreate, current_user: Usuario) -> Projeto:
        existente = self.db.query(Projeto).filter(Projeto.codigo == dados.codigo).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um projeto com este código",
            )
        projeto = Projeto(
            **dados.model_dump(),
            coordenador_id=current_user.id,
        )
        self.db.add(projeto)
        self.db.commit()
        self.db.refresh(projeto)
        return projeto

    def listar(self, current_user: Usuario, status_filtro: Optional[StatusProjeto] = None) -> List[Projeto]:
        query = self.db.query(Projeto)

        if current_user.perfil == PerfilUsuario.COORDENADOR:
            query = query.filter(Projeto.coordenador_id == current_user.id)
        # APOIO_COORDENADOR, ADMINISTRADOR e GESTOR_POLO veem todos por enquanto

        if status_filtro:
            query = query.filter(Projeto.status == status_filtro)

        return query.all()

    def obter_por_id(self, projeto_id: int, current_user: Usuario) -> Projeto:
        projeto = self.db.query(Projeto).filter(Projeto.id == projeto_id).first()

        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado",
            )

        if (
            current_user.perfil == PerfilUsuario.COORDENADOR
            and projeto.coordenador_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado a este projeto",
            )

        return projeto
