# Gestao RH Banco de Especialistas

Aplicacao web para gestao de equipes de projetos de PD&I e Recursos Humanos do **Polo de Inovacao do IFPB**. O sistema aplica as regras da **Resolucao 11/2022** para calculos de bolsas, limites de carga horaria e gera documentos PDF padronizados para submissao no SUAP.

---

## Quick Start (Desenvolvimento)

### Pre-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### 1. Clonar e configurar

```bash
git clone https://github.com/marcelomgs90/GestaoRHBancoEspecialista.git
cd GestaoRHBancoEspecialista

# Copiar arquivos de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Subir os containers

```bash
docker compose -f docker-compose.dev.yml up --build
```

### 3. Aplicar migracoes e popular dados de teste

Em outro terminal:

```bash
# Criar o schema (todas as tabelas do DER)
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Popular dados iniciais (usuarios, projeto, parametros de bolsa)
docker compose -f docker-compose.dev.yml exec backend python scripts/seed.py
```

Saida esperada do seed:
```
Executando seed...
  [OK] Perfis criados
  [OK] Usuarios criados (admin/coord/gestor/apoio)
  [OK] Projeto seed criado
  [OK] 13 parametros de regra criados

Seed concluido com sucesso!

Credenciais de acesso:
  Admin:   admin@ifpb.edu.br       / admin123
  Coord:   ana.coord@ifpb.edu.br   / coord123
  Gestor:  carlos.gestor@ifpb.edu.br / gestor123
  Apoio:   beatriz.apoio@ifpb.edu.br / apoio123
```

### 4. Acessar

| Servico | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend (Swagger)** | http://localhost:8000/docs |
| **Backend (ReDoc)** | http://localhost:8000/redoc |

---

## Usuarios de Teste

| Email | Senha | Perfil |
|-------|-------|--------|
| `admin@ifpb.edu.br` | `admin123` | Administrador |
| `ana.coord@ifpb.edu.br` | `coord123` | Coordenador |
| `carlos.gestor@ifpb.edu.br` | `gestor123` | Gestor do Polo |
| `beatriz.apoio@ifpb.edu.br` | `apoio123` | Apoio Coordenador |

---

## Comandos Uteis

### Docker

```bash
# Subir todos os servicos
docker compose -f docker-compose.dev.yml up

# Subir em background
docker compose -f docker-compose.dev.yml up -d

# Reconstruir containers (apos alterar Dockerfile ou requirements)
docker compose -f docker-compose.dev.yml up --build

# Ver logs do backend
docker compose -f docker-compose.dev.yml logs -f backend

# Parar todos os servicos
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpa banco de dados)
docker compose -f docker-compose.dev.yml down -v

# Executar comando no container do backend
docker compose -f docker-compose.dev.yml exec backend <comando>
```

### Banco de Dados

```bash
# Aplicar migracoes (criar schema)
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Ver historico de migracoes aplicadas
docker compose -f docker-compose.dev.yml exec backend alembic history

# Rodar seed (usuarios, projeto e parametros de bolsa)
docker compose -f docker-compose.dev.yml exec backend python scripts/seed.py

# Reverter ultima migracao (cuidado em producao)
docker compose -f docker-compose.dev.yml exec backend alembic downgrade -1

# Acessar PostgreSQL via psql
docker compose -f docker-compose.dev.yml exec db psql -U gestao_rh -d gestao_rh_db

# Listar tabelas
\dt

# Ver usuarios
SELECT id, nome, email, perfil FROM usuario;

# Sair
\q
```

---

## Desenvolvimento Manual (sem Docker)

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv .venv

# Ativar (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Ativar (Linux/Mac)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Subir banco PostgreSQL (via Docker)
docker compose -f docker-compose.dev.yml up db -d

# Aplicar migracoes
alembic upgrade head

# Rodar seed
python scripts/seed.py

# Iniciar servidor
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## Estrutura do Projeto

```
GestaoRHBancoEspecialista/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── core/              # Config, seguranca, database, dependencias
│   │   ├── models/            # Modelos SQLAlchemy (estrutura do banco)
│   │   ├── routers/           # Endpoints da API (adaptadores finos, sem logica)
│   │   ├── schemas/           # DTOs Pydantic (request/response)
│   │   ├── services/          # Logica de negocio (toda regra fica aqui)
│   │   ├── pdf/               # Geracao de documentos PDF (modulo isolado)
│   │   └── utils/             # Enums e helpers
│   ├── alembic/               # Migracoes de banco
│   ├── scripts/               # Scripts utilitarios
│   └── tests/                 # Testes
│
├── frontend/                   # React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4
│   ├── src/
│   │   ├── components/        # Componentes reutilizaveis (AppShell, MembroEditor)
│   │   ├── contexts/          # AuthContext (JWT + useAuth hook)
│   │   ├── hooks/             # usePerfil (RBAC), useAuth
│   │   ├── lib/               # cn (tailwind-merge), formatters
│   │   ├── pages/             # Por modulo: auth/, dashboard/, projetos/, solicitacoes/, parametros/
│   │   ├── routes/            # AppRoutes, PrivateRoute, RoleRoute
│   │   ├── services/          # api, authService, projetoService, solicitacaoService, parametroService
│   │   └── types/             # auth, enums, projeto, solicitacao
│   └── public/
│
├── docs/                       # Documentacao de requisitos
├── sprints/                    # Detalhamento por sprint
├── docker-compose.yml          # Producao
└── docker-compose.dev.yml      # Desenvolvimento
```

---

## Stack Tecnologica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | FastAPI, Python 3.12+ |
| **Banco de Dados** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 |
| **Migracoes** | Alembic (versao inicial: `alembic/versions/0001_schema_inicial.py`) |
| **Autenticacao** | JWT (python-jose) + bcrypt |
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Estilizacao** | Tailwind CSS 4 (`@import "tailwindcss"`, sem tailwind.config.js) |
| **Animacoes** | Motion (Framer Motion v12) |
| **Graficos** | Recharts |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | Axios (interceptors JWT + redirect 401) |
| **Roteamento** | React Router 7 |
| **Containers** | Docker, Docker Compose |

---

## Documentacao

- `docs/01-visao-geral.md` - Contexto e escopo
- `docs/02-modulos.md` - Modulos funcionais
- `docs/03-modelo-dados.md` - Modelo ER
- `docs/04-regras-negocio.md` - Regras e calculos
- `docs/05-cronograma-sprints.md` - Plano de entregas
- `sprints/sprint-1.md` - Detalhamento Sprint 1

---

## Troubleshooting

### Erro: "relation usuario does not exist"

As migracoes nao foram aplicadas. Execute em ordem:

```bash
# 1. Aplicar schema
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# 2. Popular dados
docker compose -f docker-compose.dev.yml exec backend python scripts/seed.py
```

### Erro: "password cannot be longer than 72 bytes" (bcrypt)

Reconstrua o container do backend e rode o seed novamente:

```bash
# Reconstruir backend
docker compose -f docker-compose.dev.yml up --build backend -d

# Rodar seed novamente
docker compose -f docker-compose.dev.yml exec backend python scripts/seed.py
```

### Login nao funciona apos subir containers

Apos subir os containers pela primeira vez, aplique migracoes e rode o seed:

```bash
# 1. Reconstruir backend se necessario
docker compose -f docker-compose.dev.yml up --build backend -d

# 2. Aplicar schema
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# 3. Rodar seed
docker compose -f docker-compose.dev.yml exec backend python scripts/seed.py
```

Acesse:
- **Frontend**: http://localhost:5173
- **Swagger**: http://localhost:8000/docs (POST /auth/login)

### Erro: "port 5432 already in use"

Outro PostgreSQL esta rodando. Pare-o ou altere a porta no `docker-compose.dev.yml`.

### Frontend nao conecta no backend

Verifique se o backend esta rodando em http://localhost:8000 e se o CORS esta configurado.

---

## Equipe

| Nome | Funcao |
|------|--------|
| Vinicius Lopes de Alencar | Backend |
| Marcelo Gomes da Silva | Backend, DevOps |
| Lindomar da Silva Junior | Frontend |
| Lucas Matheus Santos da Silva | Frontend |
| Carolina Araujo de Sousa | QA |
| Erick Victor Carvalho de Araujo | PO/Doc |
