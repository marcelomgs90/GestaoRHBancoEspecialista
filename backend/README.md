# Backend - Gestao RH Banco de Especialistas

API FastAPI para gestao de equipes de projetos de PD&I e Recursos Humanos do Polo de Inovacao do IFPB.

## Stack

- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Migracoes**: Alembic
- **Banco de Dados**: PostgreSQL 16
- **Autenticacao**: JWT com bcrypt

## Configuracao

1. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

2. Instale as dependencias:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
```

3. Execute as migracoes:
```bash
alembic upgrade head
```

4. Popule dados mockados:
```bash
python scripts/seed_data.py
```

5. Inicie o servidor:
```bash
uvicorn app.main:app --reload
```

## Endpoints

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usuarios de Teste

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@ifpb.edu.br | admin123 | Administrador |
| maria.silva@ifpb.edu.br | coord123 | Coordenador |
| joao.santos@ifpb.edu.br | gestor123 | Gestor do Polo |

## Estrutura

```
backend/
├── app/
│   ├── core/          # Configuracoes, seguranca, dependencias
│   ├── models/        # Modelos SQLAlchemy
│   ├── schemas/       # Pydantic DTOs
│   ├── routers/       # Endpoints da API
│   ├── services/      # Logica de negocio
│   ├── utils/         # Utilitarios e enums
│   └── pdf/           # Geracao de PDF
├── alembic/           # Migracoes
├── scripts/           # Scripts utilitarios
└── tests/             # Testes
```
