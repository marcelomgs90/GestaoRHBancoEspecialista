from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _is_database_url(url: str) -> bool:
    return "://" in url and not url.startswith(("http://", "https://"))


# External specialists can be configured either as a read-only database or,
# in some environments, as an HTTP API URL. SQLAlchemy must only receive
# database URLs; otherwise the whole FastAPI app fails during import.
especialistas_engine: Optional[Engine] = None
if _is_database_url(settings.BANCO_ESPECIALISTAS_URL):
    especialistas_engine = create_engine(
        settings.BANCO_ESPECIALISTAS_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"connect_timeout": 10},
    )

EspecialistasSessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=especialistas_engine)
    if especialistas_engine is not None
    else None
)
