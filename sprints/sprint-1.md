# Sprint 1 - Solicitações de RH Base (MVP)

**Objetivo:** Entregar o fluxo central de solicitação de RH com autenticação, validações e dados mockados.

**Métricas:** 9 US | 53 Story Points | 72 horas estimadas

---

## Visão Geral das Fases

```
Fase 1: Infraestrutura        [US-AQ-01, US-AQ-02]     ── pré-requisito de tudo
    |
Fase 2: Autenticação/Perfis   [US-CA-01, US-CA-02]     ── depende da Fase 1
    |
Fase 3: Solicitações de RH    [US-SD-01, US-SD-02]     ── depende das Fases 1 e 2
    |
Fase 4: Validações/Alteração  [US-SD-03, US-SD-04]     ── depende da Fase 3
    |
Fase 5: Comparação de Versões [US-SD-05]                ── depende da Fase 4
```

---

## Fase 1 — Infraestrutura

### US-AQ-01 | Preparar ambiente inicial do projeto (5 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-01 - Preparação do ambiente e repositório
**Prioridade:** Baixa

**Descrição:** Como equipe técnica, quero preparar repositório e ambiente para iniciar o desenvolvimento com rastreabilidade.

**BDD:** DADO que o projeto foi iniciado, QUANDO o ambiente for configurado, ENTAO frontend e backend devem executar localmente com documentação mínima.

**Critérios de Aceitação:**
- CA-01: O repositório deve estar criado com estrutura de branches mínima
- CA-02: O ambiente local deve executar frontend e backend
- CA-03: As variáveis de ambiente essenciais devem estar documentadas

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-AQ-01-01 | devops/doc | Preparar artefatos técnicos: repositório Git, estrutura de pastas FastAPI, Docker Compose (PostgreSQL), configuração de `.env` | Lucas | 3 | [x] |
| 2 | TK-US-AQ-01-02 | doc | Documentar configuração do ambiente, variáveis de ambiente e instruções de setup | Erick | 3 | [ ] |
| 3 | TK-US-AQ-01-03 | qa | Validar que o ambiente executa localmente, verificar evidências e rastreabilidade | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #1:**
- Criar estrutura do projeto FastAPI (`app/`, `app/models/`, `app/routes/`, `app/schemas/`, `app/services/`, `app/core/`)
- `docker-compose.yml` com PostgreSQL 16
- `.env.example` com variaveis: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `requirements.txt` com dependencias iniciais: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `python-jose`, `passlib`, `python-dotenv`
- Inicializar Alembic (`alembic init`)

---

### US-AQ-02 | Criar banco inicial com dados mockados (5 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-02 - Modelagem do banco de dados e migrações
**Prioridade:** Normal

**Descrição:** Como equipe técnica, quero criar a estrutura inicial do banco com dados mockados para antecipar validações da Sprint 1.

**BDD:** DADO que as entidades principais foram definidas, QUANDO as migrações forem executadas, ENTAO a base deve permitir testar solicitações de RH.

**Critérios de Aceitação:**
- CA-01: As tabelas principais devem possuir migrações iniciais
- CA-02: As relações devem seguir o DER revisado (docs/03-modelo-dados.md)
- CA-03: A base deve possuir dados mockados mínimos para Sprint 1

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-AQ-02-01 | devops/doc | Criar modelos SQLAlchemy e migrações Alembic, popular seed de dados mockados | Marcelo | 3 | [x] alembic/versions/0001_schema_inicial.py criado; scripts/seed.py com 4 usuários, 1 projeto e 13 parâmetros de regra |
| 5 | TK-US-AQ-02-02 | doc | Documentar estrutura do banco, relações e evidências | Erick | 3 | [ ] |
| 6 | TK-US-AQ-02-03 | qa | Validar tabelas, relações FK e dados mockados | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #4:**

Modelos SQLAlchemy para todas as tabelas do DER:
- `Usuario_Perfil` (ref_usuario PK, id, nome_completo, email, senha_hash, status, data_criacao)
- `Parametro_Regra` (ref_parametro PK, tipo_regra, valor_bolsa, limite_semanal, limite_mensal, vigencia_inicio, vigencia_fim, status)
- `Projeto` (ref_projeto PK, coordenador_id FK, titulo, status, data_inicio, data_fim)
- `Projeto_Anexo` (ref_anexo PK, projeto_id FK, tipo_documento, numero_documento, caminho_arquivo, data_upload)
- `Pesquisador_Projeto` (ref_vinculacao PK, projeto_id FK, pesquisador_id FK, fonte_financiamento, carga_horaria_semanal, valor_bolsa, categoria_bolsa, data_inicio, data_fim, versao_rh_id FK)
- `Solicitacao_RH` (ref_solicitacao PK, projeto_id FK, tipo_solicitacao, numero_documento, mes_ano, status, data_abertura)
- `Versao_RH_Projeto` (ref_versao_rh PK, solicitacao_id FK, projeto_id FK, numero_versao, status, data_versao)
- `Transferencia_RH` (ref_transferencia PK, pesquisador_id FK, projeto_origem_id FK, projeto_destino_id FK, coordenador_cedente_id FK)

Seed mockado minimo:
- 2 usuarios (1 admin, 1 coordenador)
- 1 projeto ativo
- 3 parametros de regra (Coordenador 20h, Pesquisador Master 20h, Profissional Junior 160h)
- 3 pesquisadores simulando AIE

---

## Fase 2 — Autenticação e Perfis

### US-CA-01 | Login e logout (3 pts)

**Epic:** EP-01 Módulo Controle de Acesso
**Feature:** F-CA-01 - Autenticação e sessão de usuários
**Prioridade:** Alta

**Descrição:** Como usuário autorizado, quero acessar o sistema com segurança para utilizar as funções conforme meu perfil.

**BDD:** DADO que o usuário possui credenciais válidas, QUANDO informar login e senha e confirmar, ENTAO o sistema deve criar a sessão e direcionar para a área inicial.

**Critérios de Aceitação:**
- CA-01: O usuário deve autenticar-se com credenciais válidas
- CA-02: O sistema deve bloquear acesso a rotas protegidas sem sessão ativa
- CA-03: O usuário deve conseguir encerrar a sessão com segurança

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-CA-01-01 | back | Endpoint `POST /auth/login` (retorna JWT), `POST /auth/logout`, middleware de proteção de rotas | Vinicius | 3 | [x] |
| 8 | TK-US-CA-01-02 | front | Tela de login com formulário email/senha, tratamento de erro, redirecionamento pós-login | Lindomar | 3 | [x] pages/auth/LoginPage.tsx com RHF+Zod, erro inline, redirect /dashboard |
| 9 | TK-US-CA-01-03 | qa | Testar login válido/inválido, bloqueio de rotas sem token, logout | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #7:**
- `POST /auth/login` — recebe `email` + `senha`, valida contra `Usuario_Perfil`, retorna `access_token` JWT com `sub` (ref_usuario) e `perfil`
- `POST /auth/logout` — invalidar token (blacklist ou client-side)
- Dependency `get_current_user` que extrai e valida JWT do header `Authorization: Bearer`
- Senha com hash bcrypt via `passlib`

---

### US-CA-02 | Aplicação de perfis no menu (3 pts)

**Epic:** EP-01 Módulo Controle de Acesso
**Feature:** F-CA-02 - Gestão de perfis e permissões
**Prioridade:** Normal

**Descrição:** Como administrador, quero que o menu respeite o perfil do usuário para evitar acesso indevido.

**BDD:** DADO que o usuário esteja autenticado, QUANDO acessar o menu, ENTAO o sistema deve exibir apenas as opções permitidas para seu perfil.

**Critérios de Aceitação:**
- CA-01: O sistema deve controlar permissões por perfil
- CA-02: Apenas perfis autorizados devem acessar funções administrativas
- CA-03: Os perfis Administrador, Coordenador, Gestor do Polo e Apoio Coordenador devem estar disponíveis

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-CA-02-01 | back | Middleware de autorização por perfil, decorator/dependency `require_role(...)`, endpoint `GET /auth/me` | Marcelo | 3 | [x] |
| 11 | TK-US-CA-02-02 | front | Menu dinâmico renderizado conforme perfil retornado pelo JWT/me, ocultar opções não permitidas | Lucas | 3 | [x] AppShell.tsx + hooks/usePerfil.ts com os 4 perfis; RoleRoute para restrição por rota |
| 12 | TK-US-CA-02-03 | qa | Testar acesso de cada perfil a funções administrativas e não-administrativas | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #10:**
- Enum de perfis: `ADMINISTRADOR`, `COORDENADOR`, `GESTOR_POLO`, `APOIO_COORDENADOR`
- Dependency `require_role(*roles)` que verifica `current_user.perfil in roles`
- `GET /auth/me` — retorna dados do usuario autenticado incluindo perfil
- Retornar HTTP 403 para acesso negado

---

## Fase 3 — Solicitações de RH

### US-SD-01 | Criar solicitação de implantação inicial (8 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-01 - Solicitação de implantação inicial de RH
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero criar uma solicitação de implantação inicial de RH para iniciar a equipe de um projeto.

**BDD:** DADO que exista um projeto selecionado, QUANDO o coordenador iniciar a implantação inicial, ENTAO o sistema deve criar uma solicitação vinculada ao projeto.

**Critérios de Aceitação:**
- CA-01: A implantação inicial deve estar vinculada a um projeto ativo
- CA-02: A solicitação deve possuir membros e fontes de financiamento válidas
- CA-03: A solicitação deve receber identificador manual/informado pelo usuário quando aplicável

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-SD-01-01 | back | Endpoint `POST /solicitacoes/` (tipo=Implantacao), vincular a projeto ativo, criar `Versao_RH_Projeto` inicial | Lucas | 3 | [x] |
| 14 | TK-US-SD-01-02 | front | Tela de criação: seleção de projeto, número do documento, botão criar | Lindomar | 3 | [x] ImplantacaoPage cria automaticamente a solicitação ao entrar em /projetos/:id/implantacao (criação inline sem tela dedicada pré-formulário) |
| 15 | TK-US-SD-01-03 | qa | Testar criação vinculada a projeto ativo/inativo, validar dados persistidos | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #13:**
- `POST /solicitacoes/` — body: `{ projeto_id, tipo_solicitacao: "Implantacao", numero_documento }` 
- Validar que o projeto existe e `status = "Ativo"`
- Validar que o usuário logado é coordenador do projeto
- Criar registro em `Solicitacao_RH` com `status = "Em Edicao"`
- Criar `Versao_RH_Projeto` com `numero_versao = 1`
- `GET /solicitacoes/{id}` — retorna solicitação com membros
- `GET /solicitacoes/?projeto_id=X` — lista solicitações do projeto

---

### US-SD-02 | Incluir membro na solicitação de RH (8 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-03 - Inclusão, alteração e encerramento de membros
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero incluir membros na solicitação de RH para compor a equipe do projeto.

**BDD:** DADO que exista uma solicitação em edição, QUANDO o coordenador informar especialista, perfil, fonte e vigência, ENTAO o membro deve ser incluído na proposta.

**Critérios de Aceitação:**
- CA-01: O sistema deve permitir inclusão, alteração e encerramento de membros
- CA-02: O sistema deve validar carga horária máxima e regras de bolsas
- CA-03: O sistema deve registrar vigência, fonte e perfil de cada vínculo

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-SD-02-01 | back | Endpoints CRUD para `Pesquisador_Projeto`: incluir, alterar e encerrar membro vinculado a versão de RH | Marcelo | 3 | [x] |
| 17 | TK-US-SD-02-02 | front | Formulário de inclusão de membro: busca especialista (mock), seleção de perfil/categoria, fonte, CH, vigência | Vinicius | 3 | [x] ImplantacaoPage + MembroEditor.tsx; busca via modal (candidatos e especialistas mockados até endpoint AIE) |
| 18 | TK-US-SD-02-03 | qa | Testar inclusão/alteração/encerramento, validar dados persistidos em Pesquisador_Projeto | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #16:**
- `POST /solicitacoes/{id}/membros` — body: `{ pesquisador_id, categoria_bolsa, fonte_financiamento, carga_horaria_semanal, data_inicio, data_fim }`
- Calcular `valor_bolsa` automaticamente com base em `Parametro_Regra` vigente
- Vincular ao `versao_rh_id` da solicitação
- `PUT /solicitacoes/{id}/membros/{vinculo_id}` — alterar dados do vínculo
- `DELETE /solicitacoes/{id}/membros/{vinculo_id}` — encerrar participação
- Validar que a solicitação está em `status = "Em Edicao"`

---

## Fase 4 — Validações e Alteração de RH

### US-SD-03 | Validar carga horária e bolsa do membro (8 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-03 - Inclusão, alteração e encerramento de membros
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero que o sistema valide carga horária e bolsa para reduzir erros administrativos.

**BDD:** DADO que um membro foi informado, QUANDO a carga horária ou categoria for alterada, ENTAO o sistema deve validar limites e informar inconsistências.

**Critérios de Aceitação:**
- CA-01: O sistema deve validar carga horária máxima e regras de bolsas (Resolução 11/2022)
- CA-02: O sistema deve registrar vigência, fonte e perfil de cada vínculo

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-SD-03-01 | back | Serviço de validação: CH global do pesquisador (todos os projetos), cálculo automático de bolsa via Parametro_Regra, retorno de erros detalhados | Vinicius | 3 | [x] |
| 20 | TK-US-SD-03-02 | front | Exibir feedback de validação em tempo real no formulário: alertas de CH excedida, valor calculado da bolsa | Lindomar | 3 | [x] MembroEditor.tsx faz debounce (400ms) e exibe cards: valor proporcional calculado (POST /parametros/calcular-bolsa) e status CH global com alerta visual (POST /parametros/validar-ch-global) |
| 21 | TK-US-SD-03-03 | qa | Testar cenários: CH no limite, CH excedida, categoria inexistente, cálculo proporcional | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #19:**
- Serviço `validar_carga_horaria(pesquisador_id, ch_semanal_nova, projeto_id)`:
  - Somar CH de todas as alocações ativas do pesquisador em todos os projetos
  - Comparar com `limite_semanal` de `Parametro_Regra`
  - Retornar erro se exceder
- Serviço `calcular_bolsa(categoria_bolsa, ch_semanal, data_referencia)`:
  - Buscar `Parametro_Regra` com `tipo_regra = categoria_bolsa` e vigência que contenha `data_referencia`
  - Calcular proporcional: `valor_bolsa = (ch_semanal / ch_referencia) * valor_bolsa_referencia`
- Integrar validação nos endpoints de inclusão/alteração de membro (Task #16)

---

### US-SD-04 | Criar solicitação de alteração de RH (8 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-02 - Solicitação de alteração de RH
**Prioridade:** Alta

**Descrição:** Como coordenador, quero abrir uma alteração de RH para mudar uma equipe já implantada.

**BDD:** DADO que exista uma versão vigente de RH, QUANDO o coordenador solicitar alteração, ENTAO o sistema deve criar uma versão proposta separada da atual.

**Critérios de Aceitação:**
- CA-01: A alteração deve partir de uma versão de RH já existente
- CA-02: O sistema deve permitir registrar motivo e dados alterados
- CA-03: A versão proposta deve ficar separada da versão atual até homologação

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 22 | TK-US-SD-04-01 | back | Endpoint `POST /solicitacoes/` (tipo=Alteracao): clonar versão vigente como "Antes", criar nova versão "Depois" editável | Marcelo | 3 | [x] SolicitacaoService._criar_versao_alteracao + _clonar_membros() implementados |
| 23 | TK-US-SD-04-02 | front | Tela de solicitação de alteração: exibir equipe atual, permitir edições na versão proposta | Lucas | 3 | [x] AlteracaoPage.tsx em /projetos/:id/alteracao: equipe vigente (read-only) + equipe proposta editável com MembroEditor; salva via PUT/POST/DELETE em batch |
| 24 | TK-US-SD-04-03 | qa | Testar criação de alteração, separação Antes/Depois, edição da versão proposta sem afetar a atual | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #22:**
- Ao criar solicitação tipo "Alteração":
  1. Buscar última `Versao_RH_Projeto` com `status = "Vigente"` do projeto
  2. Clonar todos os registros de `Pesquisador_Projeto` dessa versão como versão "Antes" (somente leitura)
  3. Criar nova `Versao_RH_Projeto` com `numero_versao = anterior + 1` e `status = "Proposta"`
  4. Clonar mesmos registros como base editável da versão "Depois"
- O coordenador edita apenas a versão "Depois" (reutiliza endpoints de inclusão/alteração/encerramento de membro)
- Manter campo de justificativa na `Solicitacao_RH`

---

## Fase 5 — Comparação de Versões

### US-SD-05 | Comparar equipe atual e proposta (5 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-04 - Versões de RH e comparação Atual x Proposta
**Prioridade:** Alta

**Descrição:** Como gestor, quero comparar equipe atual e proposta para entender as mudanças antes da homologação.

**BDD:** DADO que exista uma versão atual e uma proposta, QUANDO o usuário abrir a comparação, ENTAO o sistema deve exibir inclusões, alterações e encerramentos.

**Critérios de Aceitação:**
- CA-01: O sistema deve listar versões de RH por projeto
- CA-02: O sistema deve comparar equipe atual e equipe proposta
- CA-03: As diferenças devem ser exibidas de forma clara para homologação

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 25 | TK-US-SD-05-01 | back | Endpoint `GET /solicitacoes/{id}/comparacao`: diff entre versão Antes e Depois, retornando listas de inclusões, alterações e encerramentos | Vinicius | 3 | [x] |
| 26 | TK-US-SD-05-02 | front | Tela de comparação lado a lado: destacar inclusões (verde), alterações (amarelo), encerramentos (vermelho) | Lindomar | 3 | [x] SolicitacaoComparacaoPage.tsx em /solicitacoes/:id/comparacao: cards resumo + tabelas por fonte com destaque visual de novo/removido/mantido |
| 27 | TK-US-SD-05-03 | qa | Testar comparação com cenários: inclusão pura, encerramento puro, alteração de CH/fonte, misto | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #25:**
- `GET /solicitacoes/{id}/comparacao` — retorna:
  ```json
  {
    "antes": { "empresa": [...], "embrapii": [...], "sebrae": [...] },
    "depois": { "empresa": [...], "embrapii": [...], "sebrae": [...] },
    "diferencas": {
      "inclusoes": [ { "pesquisador": "...", "categoria": "...", "fonte": "..." } ],
      "alteracoes": [ { "pesquisador": "...", "campo": "ch_semanal", "de": 20, "para": 16 } ],
      "encerramentos": [ { "pesquisador": "...", "motivo": "..." } ]
    }
  }
  ```
- Agrupar membros por `fonte_financiamento` (ordem fixa: EMPRESA, EMBRAPII, SEBRAE)
- Comparar por `pesquisador_id` + `fonte_financiamento` para detectar diferenças
- `GET /solicitacoes/{id}/versoes` — lista todas as versões de RH da solicitação

---

## Resumo de Carga por Responsável

| Responsável | Função | Tasks | Horas |
|-------------|--------|-------|-------|
| Vinicius | back | #4, #7, #13, #19, #25 | 15h |
| Marcelo | back | #1, #10, #16, #22 | 12h |
| Lindomar | front | #8, #14, #20, #26 | 12h |
| Lucas | front | #11, #17, #23 | 9h |
| Carolina | qa | #3, #6, #9, #12, #15, #18, #21, #24, #27 | 18h |
| Erick | doc | #2, #5 | 6h |
| **Total** | | **27 tasks** | **72h** |

---

## Checklist de Entrega da Sprint

- [x] Ambiente local rodando (FastAPI + PostgreSQL via Docker)
- [x] Todas as tabelas do DER com migrações Alembic (`alembic/versions/0001_schema_inicial.py`)
- [x] Dados iniciais populados via `scripts/seed.py` (4 usuários, 1 projeto, 13 parâmetros de regra)
- [x] Login/logout funcional com JWT (back + front com RHF+Zod e erro inline)
- [x] Menu dinamico por perfil — 4 perfis mapeados em AppShell.tsx + usePerfil.ts + RoleRoute
- [x] Criar solicitação de implantação vinculada a projeto (back [x] / front [x] — criação automática ao entrar em /implantacao)
- [x] Incluir/alterar/encerrar membros em solicitação (back [x] / front [x] — ImplantacaoPage + MembroEditor)
- [x] Validação automática de CH global e cálculo de bolsa (back [x] endpoints /parametros/calcular-bolsa e /parametros/validar-ch-global / front [x] preview em tempo real com debounce no MembroEditor)
- [x] Criar solicitação de alteração com versionamento Antes/Depois (back [x] clonagem implementada / front [x] AlteracaoPage.tsx em /projetos/:id/alteracao)
- [x] Tela de comparação de versões com diferenças destacadas (back [x] / front [x] SolicitacaoComparacaoPage.tsx em /solicitacoes/:id/comparacao)

**Pendente (fora do escopo de implementação desta sprint):**
- [ ] Tasks de QA (Carolina) — cenários de teste não executados
- [ ] Tasks de documentação (Erick) — evidências e guias de configuração
- [ ] Busca real de especialistas (AIE) — permanece mockada até Sprint 2 (endpoint Banco de Especialistas)
- [ ] CRUD de tabelas de bolsas no backend (`/parametros` CRUD) — UI existe com feature-flag, backend pendente para Sprint 4
