from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base


class ProjetoAnexo(Base):
    """Anexos do projeto (Plano de Trabalho, Acordo de Parceria, etc.)."""
    __tablename__ = "projeto_anexo"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)

    tipo_documento = Column(String(100), nullable=False)
    numero_documento = Column(String(100), nullable=True)
    caminho_arquivo = Column(String(500), nullable=False)
    nome_arquivo_original = Column(String(255), nullable=False)

    data_upload = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamento
    projeto = relationship("Projeto", back_populates="anexos")
