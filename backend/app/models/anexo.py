from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
)
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.guid import GUID


class Anexo(Base):
    """Anexos amplos do projeto (upload manual ou gerados pelo sistema).

    Distinto de `ProjetoAnexo`, que registra documentos formais (Plano de
    Trabalho, Acordo de Parceria, Documento Complementar) editados na
    `ProjetoEditPage`. Este modelo atende a um recurso de listagem geral
    exibido na secao ANEXOS da `ProjetoDetailPage`.
    """

    __tablename__ = "anexo"

    id = Column(GUID(), primary_key=True, default=uuid4)
    id_projeto = Column(
        Integer,
        ForeignKey("projeto.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_type = Column(String(100), nullable=False)
    file_bytes = Column(LargeBinary, nullable=False)
    nome_arquivo = Column(String(255), nullable=False)
    tamanho_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(
        Integer,
        ForeignKey("usuario.id", ondelete="SET NULL"),
        nullable=True,
    )
    origem = Column(String(20), nullable=False)

    projeto = relationship("Projeto")
    criador = relationship("Usuario", foreign_keys=[created_by])

    __table_args__ = (
        CheckConstraint(
            "origem IN ('USUARIO','SISTEMA')",
            name="ck_anexo_origem",
        ),
        CheckConstraint(
            "(origem = 'SISTEMA' AND created_by IS NULL) "
            "OR (origem = 'USUARIO' AND created_by IS NOT NULL)",
            name="ck_anexo_origem_created_by",
        ),
        Index(
            "ix_anexo_id_projeto_origem_created_at",
            "id_projeto",
            "origem",
            "created_at",
        ),
    )
