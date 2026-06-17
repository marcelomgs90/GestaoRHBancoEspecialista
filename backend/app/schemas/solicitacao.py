from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.utils.enums import StatusSolicitacao, TipoJustificativaSolicitacao, TipoSolicitacao


class SolicitacaoCreate(BaseModel):
    identificador: str
    projeto_id: int
    tipo: TipoSolicitacao
    justificativa: Optional[str] = None
    mes_ano_referencia: Optional[str] = None

    @model_validator(mode="after")
    def validar_justificativa_obrigatoria(self):
        if self.tipo in (TipoSolicitacao.IMPLANTACAO, TipoSolicitacao.ALTERACAO):
            if not self.justificativa or not self.justificativa.strip():
                raise ValueError("Justificativa e obrigatoria para implantacao e alteracao")
            self.justificativa = self.justificativa.strip()
        return self


class SolicitacaoRejeitarRequest(BaseModel):
    justificativa: Optional[str] = None


class SolicitacaoJustificativaUpdate(BaseModel):
    justificativa: str

    @field_validator("justificativa")
    @classmethod
    def validar_justificativa(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Justificativa e obrigatoria")
        return value


class SolicitacaoJustificativaResponse(BaseModel):
    id: int
    tipo: TipoJustificativaSolicitacao
    descricao: str
    criado_por: int
    criado_em: datetime

    class Config:
        from_attributes = True


class SolicitacaoImplantacaoCreate(BaseModel):
    projeto_id: int
    identificador: str
    justificativa: str

    @field_validator("justificativa")
    @classmethod
    def validar_justificativa(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Justificativa e obrigatoria para implantacao")
        return value


class SolicitacaoResponse(BaseModel):
    id: int
    identificador: str
    projeto_id: int
    tipo: TipoSolicitacao
    status: StatusSolicitacao
    justificativa_implantacao: Optional[str] = None
    justificativa_alteracao: Optional[str] = None
    justificativa_rejeicao: Optional[str] = None
    justificativas: list[SolicitacaoJustificativaResponse] = Field(default_factory=list)
    mes_ano_referencia: Optional[str]
    criado_por: int
    criado_em: datetime

    class Config:
        from_attributes = True
