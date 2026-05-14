from pydantic import BaseModel, EmailStr
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
