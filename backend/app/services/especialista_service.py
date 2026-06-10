from sqlalchemy.orm import Session, contains_eager
from sqlalchemy import or_
from app.models.especialista_externo import EspecialistaExterno, UsuarioExterno
from app.schemas.especialista import EspecialistaResponse

class EspecialistaService:
    def __init__(self, db: Session):
        self.db = db

    def buscar_especialistas(self, termo: str = None) -> list[EspecialistaResponse]:
        """
        Busca especialistas no banco externo integrando com a tabela de usuários.
        Filtra por nome (full_name) ou CPF (matricula).
        """
        # O contains_eager avisa ao SQLAlchemy que o usuário já foi trazido no JOIN,
        # evitando consultas extras ao acessar r.usuario.full_name
        query = (
            self.db.query(EspecialistaExterno)
            .join(EspecialistaExterno.usuario)
            .options(contains_eager(EspecialistaExterno.usuario))
        )

        if termo:
            filtro = f"%{termo}%"
            query = query.filter(
                or_(
                    UsuarioExterno.full_name.ilike(filtro),
                    UsuarioExterno.cpf.ilike(filtro)
                )
            )

        resultados = query.all()
        
        return [
            EspecialistaResponse(
                id=r.id,
                nome=r.usuario.full_name,
                matricula=r.usuario.cpf
            ) for r in resultados
        ]