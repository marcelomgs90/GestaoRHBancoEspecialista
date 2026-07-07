from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator
from app.utils.enums import PerfilUsuario


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioResponse(BaseModel):
    id: int
    ref_usuario: str
    nome: str
    email: str
    perfil: PerfilUsuario
    ativo: bool

    class Config:
        from_attributes = True


class ConvitePrimeiroAcessoResponse(BaseModel):
    valido: bool
    nome: str
    email: str
    expira_em: datetime


class DefinirSenhaRequest(BaseModel):
    senha: str = Field(min_length=8)
    confirmar_senha: str = Field(min_length=8)

    @model_validator(mode="after")
    def validar_confirmacao(self):
        if self.senha != self.confirmar_senha:
            raise ValueError("Confirmacao de senha nao confere")
        return self


class DefinirSenhaResponse(BaseModel):
    message: str
