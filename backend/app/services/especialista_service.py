from typing import List, Optional, Tuple

from sqlalchemy import or_, text
from sqlalchemy.orm import Session, contains_eager
from app.models.especialista_externo import EspecialistaExterno, UsuarioExterno
from app.schemas.especialista import EspecialistaResponse, PesquisadorResponse


class EspecialistaService:
    def __init__(self, db: Session):
        self.db = db

    def buscar_especialistas(self, termo: str = None) -> list[EspecialistaResponse]:
        """
        Busca especialistas no banco externo integrando com a tabela de usuários.
        Filtra por nome (full_name) ou CPF (matricula).

        Nao aplica filtro por tipo — esta query e usada por ImplantacaoPage e
        AlteracaoPage, que precisam listar todos os especialistas.
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

    def listar_pesquisadores(
        self,
        tipo: Optional[str] = None,
        termo: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[PesquisadorResponse], int]:
        """
        Lista pesquisadores do Banco Especialista com filtros opcionais.

        Implementacao usa SQL cru parametrizado e INNER JOIN entre
        `public.users` e `public.users_specialist_types` (via
        `users.specialist_type_id`). Nao depende de coluna `tipo_vinculo`
        (que nao existe no schema externo real).

        - `tipo`: filtra por tipo de especialista via `ust.name ILIKE %X%`.
          Quando omitido, retorna todos os tipos. Usado pela tela de criacao
          de projeto para restringir a "Servidor".
        - `termo`: aplica ILIKE sobre `full_name` e `cpf`.
        - Pagina via `page` (>=1) e `per_page` (1..100).

        Retorna (items, total). O total e calculado antes da paginacao.
        """
        select_columns = (
            "users.id, users.cpf AS matricula, users.full_name AS nome, "
            "ust.name AS tipo_vinculo"
        )

        where_clauses: List[str] = []
        params: dict = {}

        if tipo:
            where_clauses.append("ust.name ILIKE :tipo")
            params["tipo"] = f"%{tipo}%"

        if termo:
            where_clauses.append("(users.full_name ILIKE :termo OR users.cpf ILIKE :termo)")
            params["termo"] = f"%{termo}%"

        where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        total = self.db.execute(
            text(
                f"SELECT COUNT(*) FROM public.users AS users "
                f"INNER JOIN public.users_specialist_types AS ust "
                f"ON ust.id = users.specialist_type_id{where_sql}"
            ),
            params,
        ).scalar_one()

        select_sql = (
            f"SELECT {select_columns} "
            f"FROM public.users AS users "
            f"INNER JOIN public.users_specialist_types AS ust "
            f"ON ust.id = users.specialist_type_id{where_sql} "
            f"ORDER BY users.id ASC LIMIT :limit OFFSET :offset"
        )
        params_with_pagination = {
            **params,
            "limit": per_page,
            "offset": (page - 1) * per_page,
        }

        rows = self.db.execute(text(select_sql), params_with_pagination).fetchall()

        items = [
            PesquisadorResponse(
                id=row.id,
                nome=row.nome,
                matricula=row.matricula,
                tipo_vinculo=row.tipo_vinculo,
            )
            for row in rows
        ]
        return items, total