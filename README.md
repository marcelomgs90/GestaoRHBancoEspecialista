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

### 3. Criar tabelas e popular dados de teste

Em outro terminal:

```bash
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_data.py
```

> **Nota:** As migracoes Alembic (`alembic/versions/`) ainda nao foram geradas. O seed cria as tabelas diretamente via `Base.metadata.create_all`. Para gerar a primeira migracao versionada:
> ```bash
> docker compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "initial"
> docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
> ```

Saida esperada:
```
Iniciando seed de dados...
Tabelas criadas.
Perfis criados.
Usuarios criados.
Parametros criados.
Projeto e pesquisadores criados.

Seed concluido com sucesso!
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
| `maria.silva@ifpb.edu.br` | `coord123` | Coordenador |
| `joao.santos@ifpb.edu.br` | `gestor123` | Gestor do Polo |

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
# Rodar seed (criar usuarios e dados de teste)
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_data.py

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
python -m venv venv

# Ativar (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Subir banco PostgreSQL (via Docker)
docker compose -f docker-compose.dev.yml up db -d

# Rodar seed
python scripts/seed_data.py

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
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── contexts/          # Context API (Auth)
│   │   ├── pages/             # Paginas
│   │   ├── services/          # Chamadas API
│   │   └── types/             # TypeScript types
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
| **Backend** | FastAPI, Python 3.11 |
| **Banco de Dados** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 |
| **Migracoes** | Alembic |
| **Autenticacao** | JWT (python-jose) + bcrypt |
| **Frontend** | React 18, TypeScript, Vite |
| **HTTP Client** | Axios |
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

As tabelas nao foram criadas. Execute o seed:

```bash
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_data.py
```

### Erro: "password cannot be longer than 72 bytes" (bcrypt)

Reconstrua o container do backend e rode o seed novamente:

```bash
# Reconstruir backend
docker compose -f docker-compose.dev.yml up --build backend -d

# Rodar seed novamente
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_data.py
```

### Login nao funciona apos subir containers

Apos subir os containers pela primeira vez, e necessario rodar o seed para criar as tabelas e usuarios:

```bash
# 1. Reconstruir backend (garante dependencias atualizadas)
docker compose -f docker-compose.dev.yml up --build backend -d

# 2. Rodar seed
docker compose -f docker-compose.dev.yml exec backend python scripts/seed_data.py
```

Se aparecer `Seed concluido com sucesso!`, teste o login:

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
