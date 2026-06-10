from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configuração do Banco de Especialistas (Externo - Somente Leitura)
especialistas_engine = create_engine(
    settings.BANCO_ESPECIALISTAS_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 10}  # Timeout de 10 segundos para conexões PostgreSQL
)

EspecialistasSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=especialistas_engine)
