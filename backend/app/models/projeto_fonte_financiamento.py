from sqlalchemy import Column, ForeignKey, Integer, Numeric, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import FonteFinanciamento


class ProjetoFonteFinanciamento(Base, TimestampMixin):
    """Fonte de financiamento vinculada a um projeto."""

    __tablename__ = "projeto_fonte_financiamento"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projeto.id", ondelete="CASCADE"), nullable=False)
    fonte = Column(SQLEnum(FonteFinanciamento), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)

    projeto = relationship("Projeto", back_populates="fontes_financiamento")

    __table_args__ = (
        UniqueConstraint("projeto_id", "fonte", name="uq_projeto_fonte_financiamento"),
    )
