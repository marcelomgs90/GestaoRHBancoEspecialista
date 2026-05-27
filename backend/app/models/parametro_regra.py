from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, Enum as SQLEnum
from app.models.base import Base, TimestampMixin
from app.utils.enums import TipoParametroRegra, CategoriaBolsa


class ParametroRegra(Base, TimestampMixin):
    """
    Parâmetros e regras com vigência temporal.
    Conforme Resolução 11/2022 - nunca sobrescrever valores históricos.
    """
    __tablename__ = "parametro_regra"

    id = Column(Integer, primary_key=True, index=True)
    tipo_regra = Column(SQLEnum(TipoParametroRegra), nullable=False, index=True)
    categoria_bolsa = Column(SQLEnum(CategoriaBolsa), nullable=True, index=True)
    descricao = Column(String(255), nullable=False)

    # Valores
    valor_bolsa_referencia = Column(Numeric(10, 2), nullable=True)
    carga_horaria_referencia = Column(Integer, nullable=True)
    limite_carga_horaria_semanal = Column(Integer, nullable=True)

    # Vigência temporal
    vigencia_inicio = Column(Date, nullable=False, index=True)
    vigencia_fim = Column(Date, nullable=True, index=True)

    # Status
    ativo = Column(Boolean, default=True, nullable=False)
