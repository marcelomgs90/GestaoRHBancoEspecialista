from datetime import date, datetime
from decimal import Decimal
import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.utils.enums import FonteFinanciamento, StatusProjeto, TipoDocumentoProjeto


class ProjetoFonteFinanciamento(BaseModel):
    fonte: FonteFinanciamento
    valor: Decimal = Field(gt=0)


class ProjetoCreate(BaseModel):
    codigo: Optional[str] = None
    sigla: str = Field(min_length=5, max_length=20)
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

    @field_validator("sigla", mode="before")
    @classmethod
    def validar_sigla(cls, sigla: str):
        sigla_normalizada = str(sigla).strip()
        if not re.fullmatch(r"[A-Za-z0-9]{5,20}", sigla_normalizada):
            raise ValueError("Sigla deve ser alfanumerica e ter entre 5 e 20 caracteres")
        return sigla_normalizada

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
    codigo: Optional[str] = None
    sigla: str = Field(min_length=5, max_length=20)
    titulo: str
    descricao: Optional[str] = None
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

    @field_validator("sigla", mode="before")
    @classmethod
    def validar_sigla(cls, sigla: str):
        sigla_normalizada = str(sigla).strip()
        if not re.fullmatch(r"[A-Za-z0-9]{5,20}", sigla_normalizada):
            raise ValueError("Sigla deve ser alfanumerica e ter entre 5 e 20 caracteres")
        return sigla_normalizada

    @model_validator(mode="after")
    def validar_datas(self):
        if self.data_fim < self.data_inicio:
            raise ValueError("Data de encerramento deve ser posterior ao inicio")
        return self


class ProjetoResponse(BaseModel):
    id: int
    codigo: Optional[str] = None
    sigla: str
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
