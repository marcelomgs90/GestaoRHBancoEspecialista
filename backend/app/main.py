from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import (
    auth,
    usuarios,
    projetos,
    solicitacoes,
    membros,
    versoes,
    parametros,
    especialistas,
    anexos,
)

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para gestão de equipes de projetos de PD&I e Recursos Humanos do Polo de Inovação do IFPB",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://gestaorh.softmgs.com.br"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(projetos.router, prefix="/projetos", tags=["Projetos"])
app.include_router(solicitacoes.router, prefix="/solicitacoes", tags=["Solicitações"])
app.include_router(membros.router, prefix="/solicitacoes", tags=["Membros"])
app.include_router(versoes.router, prefix="/solicitacoes", tags=["Versões"])
app.include_router(parametros.router, prefix="/parametros", tags=["Parâmetros"])
app.include_router(especialistas.router)
app.include_router(anexos.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
