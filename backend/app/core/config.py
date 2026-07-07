from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://gestao_rh:gestao_rh_pass@localhost:5432/gestao_rh_db"

    # JWT Authentication
    SECRET_KEY: str = "sua-chave-secreta-aqui-mude-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # External Database (Read-Only)
    BANCO_ESPECIALISTAS_URL: str = "postgresql://usuario:senha@host-do-banco:5432/nome_do_banco"

    # Application
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Gestao RH Banco de Especialistas"
    APP_VERSION: str = "1.0.0"
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
