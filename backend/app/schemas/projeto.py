from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.utils.enums import FonteFinanciamento, StatusProjeto, TipoDocumentoProjeto


class ProjetoFonteFinanciamento(BaseModel):
    fonte: FonteFinanciamento
    valor: Decimal = Field(gt=0)


class ProjetoCreate(BaseModel):
    codigo: Optional[str] = None
    titulo: str
    descricao: Optional[str] = None
    fontes_financiamento: list[ProjetoFonteFinanciamento] = Field(min_length=1, max_length=3)
    data_inicio: date
    data_fim: date
    status: StatusProjeto = StatusProjeto.ATIVO

    @field_validator("codigo", mode="before")
    @classmethod
    def normalizar_codigo(cls, codigo: Optional[str]):
        if codigo is None:
            return None
        codigo_normalizado = str(codigo).strip()
        return codigo_normalizado or None

    @field_validator("fontes_financiamento")
    @classmethod
    def validar_fontes(cls, fontes: list[ProjetoFonteFinanciamento]):
        fontes_informadas = [item.fonte for item in fontes]
        if FonteFinanciamento.EMPRESA not in fontes_informadas:
            raise ValueError("A fonte EMPRESA e obrigatoria")
        if len(fontes_informadas) != len(set(fontes_informadas)):
            raise ValueError("Nao e permitido repetir fontes de financiamento")
        return fontes

    @model_validator(mode="after")
    def validar_datas(self):
        if self.data_fim < self.data_inicio:
            raise ValueError("Data de encerramento deve ser posterior ao inicio")
        return self


class ProjetoUpdate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    data_inicio: date
    data_fim: date
    status: StatusProjeto = StatusProjeto.ATIVO

    @model_validator(mode="after")
    def validar_datas(self):
        if self.data_fim < self.data_inicio:
            raise ValueError("Data de encerramento deve ser posterior ao inicio")
        return self


class ProjetoResponse(BaseModel):
    id: int
    codigo: str
    titulo: str
    descricao: Optional[str]
    fontes_financiamento: list[ProjetoFonteFinanciamento]
    data_inicio: date
    data_fim: date
    status: StatusProjeto
    coordenador_id: int
    coordenador_nome: Optional[str] = None
    usuario_nome: Optional[str] = None
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


class ProjetoAnexoResponse(BaseModel):
    id: int
    projeto_id: int
    tipo_documento: TipoDocumentoProjeto
    numero_documento: Optional[str] = None
    nome_arquivo_original: str
    content_type: Optional[str] = None
    tamanho_bytes: Optional[int] = None
    data_upload: datetime

    class Config:
        from_attributes = True
