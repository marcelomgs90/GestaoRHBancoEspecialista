# Sprint 1 - Solicitacoes de RH Base (MVP)

**Objetivo:** Entregar o fluxo central de solicitacao de RH com autenticacao, validacoes e dados mockados.

**Metricas:** 9 US | 53 Story Points | 72 horas estimadas

---

## Visao Geral das Fases

```
Fase 1: Infraestrutura        [US-AQ-01, US-AQ-02]     ── pre-requisito de tudo
    |
Fase 2: Autenticacao/Perfis   [US-CA-01, US-CA-02]     ── depende da Fase 1
    |
Fase 3: Solicitacoes de RH    [US-SD-01, US-SD-02]     ── depende das Fases 1 e 2
    |
Fase 4: Validacoes/Alteracao  [US-SD-03, US-SD-04]     ── depende da Fase 3
    |
Fase 5: Comparacao de Versoes [US-SD-05]                ── depende da Fase 4
```

---

## Fase 1 — Infraestrutura

### US-AQ-01 | Preparar ambiente inicial do projeto (5 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-01 - Preparacao do ambiente e repositorio
**Prioridade:** Baixa

**Descricao:** Como equipe tecnica, quero preparar repositorio e ambiente para iniciar o desenvolvimento com rastreabilidade.

**BDD:** DADO que o projeto foi iniciado, QUANDO o ambiente for configurado, ENTAO frontend e backend devem executar localmente com documentacao minima.

**Criterios de Aceitacao:**
- CA-01: O repositorio deve estar criado com estrutura de branches minima
- CA-02: O ambiente local deve executar frontend e backend
- CA-03: As variaveis de ambiente essenciais devem estar documentadas

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-AQ-01-01 | devops/doc | Preparar artefatos tecnicos: repositorio Git, estrutura de pastas FastAPI, Docker Compose (PostgreSQL), configuracao de `.env` | Lucas | 3 | [x] |
| 2 | TK-US-AQ-01-02 | doc | Documentar configuracao do ambiente, variaveis de ambiente e instrucoes de setup | Erick | 3 | [ ] |
| 3 | TK-US-AQ-01-03 | qa | Validar que o ambiente executa localmente, verificar evidencias e rastreabilidade | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #1:**
- Criar estrutura do projeto FastAPI (`app/`, `app/models/`, `app/routes/`, `app/schemas/`, `app/services/`, `app/core/`)
- `docker-compose.yml` com PostgreSQL 16
- `.env.example` com variaveis: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `requirements.txt` com dependencias iniciais: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `python-jose`, `passlib`, `python-dotenv`
- Inicializar Alembic (`alembic init`)

---

### US-AQ-02 | Criar banco inicial com dados mockados (5 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-02 - Modelagem do banco de dados e migracoes
**Prioridade:** Normal

**Descricao:** Como equipe tecnica, quero criar a estrutura inicial do banco com dados mockados para antecipar validacoes da Sprint 1.

**BDD:** DADO que as entidades principais foram definidas, QUANDO as migracoes forem executadas, ENTAO a base deve permitir testar solicitacoes de RH.

**Criterios de Aceitacao:**
- CA-01: As tabelas principais devem possuir migracoes iniciais
- CA-02: As relacoes devem seguir o DER revisado (docs/03-modelo-dados.md)
- CA-03: A base deve possuir dados mockados minimos para Sprint 1

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-AQ-02-01 | devops/doc | Criar modelos SQLAlchemy e migracoes Alembic, popular seed de dados mockados | Marcelo | 3 | [x] |
| 5 | TK-US-AQ-02-02 | doc | Documentar estrutura do banco, relacoes e evidencias | Erick | 3 | [ ] |
| 6 | TK-US-AQ-02-03 | qa | Validar tabelas, relacoes FK e dados mockados | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #4:**

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

## Fase 2 — Autenticacao e Perfis

### US-CA-01 | Login e logout (3 pts)

**Epic:** EP-01 Modulo Controle de Acesso
**Feature:** F-CA-01 - Autenticacao e sessao de usuarios
**Prioridade:** Alta

**Descricao:** Como usuario autorizado, quero acessar o sistema com seguranca para utilizar as funcoes conforme meu perfil.

**BDD:** DADO que o usuario possui credenciais validas, QUANDO informar login e senha e confirmar, ENTAO o sistema deve criar a sessao e direcionar para a area inicial.

**Criterios de Aceitacao:**
- CA-01: O usuario deve autenticar-se com credenciais validas
- CA-02: O sistema deve bloquear acesso a rotas protegidas sem sessao ativa
- CA-03: O usuario deve conseguir encerrar a sessao com seguranca

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-CA-01-01 | back | Endpoint `POST /auth/login` (retorna JWT), `POST /auth/logout`, middleware de protecao de rotas | Vinicius | 3 | [x] |
| 8 | TK-US-CA-01-02 | front | Tela de login com formulario email/senha, tratamento de erro, redirecionamento pos-login | Lindomar | 3 | [x] |
| 9 | TK-US-CA-01-03 | qa | Testar login valido/invalido, bloqueio de rotas sem token, logout | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #7:**
- `POST /auth/login` — recebe `email` + `senha`, valida contra `Usuario_Perfil`, retorna `access_token` JWT com `sub` (ref_usuario) e `perfil`
- `POST /auth/logout` — invalidar token (blacklist ou client-side)
- Dependency `get_current_user` que extrai e valida JWT do header `Authorization: Bearer`
- Senha com hash bcrypt via `passlib`

---

### US-CA-02 | Aplicacao de perfis no menu (3 pts)

**Epic:** EP-01 Modulo Controle de Acesso
**Feature:** F-CA-02 - Gestao de perfis e permissoes
**Prioridade:** Normal

**Descricao:** Como administrador, quero que o menu respeite o perfil do usuario para evitar acesso indevido.

**BDD:** DADO que o usuario esteja autenticado, QUANDO acessar o menu, ENTAO o sistema deve exibir apenas as opcoes permitidas para seu perfil.

**Criterios de Aceitacao:**
- CA-01: O sistema deve controlar permissoes por perfil
- CA-02: Apenas perfis autorizados devem acessar funcoes administrativas
- CA-03: Os perfis Administrador, Coordenador, Gestor do Polo e Apoio Coordenador devem estar disponiveis

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-CA-02-01 | back | Middleware de autorizacao por perfil, decorator/dependency `require_role(...)`, endpoint `GET /auth/me` | Marcelo | 3 | [x] |
| 11 | TK-US-CA-02-02 | front | Menu dinamico renderizado conforme perfil retornado pelo JWT/me, ocultar opcoes nao permitidas | Lucas | 3 | [x] |
| 12 | TK-US-CA-02-03 | qa | Testar acesso de cada perfil a funcoes administrativas e nao-administrativas | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #10:**
- Enum de perfis: `ADMINISTRADOR`, `COORDENADOR`, `GESTOR_POLO`, `APOIO_COORDENADOR`
- Dependency `require_role(*roles)` que verifica `current_user.perfil in roles`
- `GET /auth/me` — retorna dados do usuario autenticado incluindo perfil
- Retornar HTTP 403 para acesso negado

---

## Fase 3 — Solicitacoes de RH

### US-SD-01 | Criar solicitacao de implantacao inicial (8 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-01 - Solicitacao de implantacao inicial de RH
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero criar uma solicitacao de implantacao inicial de RH para iniciar a equipe de um projeto.

**BDD:** DADO que exista um projeto selecionado, QUANDO o coordenador iniciar a implantacao inicial, ENTAO o sistema deve criar uma solicitacao vinculada ao projeto.

**Criterios de Aceitacao:**
- CA-01: A implantacao inicial deve estar vinculada a um projeto ativo
- CA-02: A solicitacao deve possuir membros e fontes de financiamento validas
- CA-03: A solicitacao deve receber identificador manual/informado pelo usuario quando aplicavel

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-SD-01-01 | back | Endpoint `POST /solicitacoes/` (tipo=Implantacao), vincular a projeto ativo, criar `Versao_RH_Projeto` inicial | Lucas | 3 | [x] |
| 14 | TK-US-SD-01-02 | front | Tela de criacao: selecao de projeto, numero do documento, botao criar | Lindomar | 3 | [ ] |
| 15 | TK-US-SD-01-03 | qa | Testar criacao vinculada a projeto ativo/inativo, validar dados persistidos | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #13:**
- `POST /solicitacoes/` — body: `{ projeto_id, tipo_solicitacao: "Implantacao", numero_documento }` 
- Validar que o projeto existe e `status = "Ativo"`
- Validar que o usuario logado e coordenador do projeto
- Criar registro em `Solicitacao_RH` com `status = "Em Edicao"`
- Criar `Versao_RH_Projeto` com `numero_versao = 1`
- `GET /solicitacoes/{id}` — retorna solicitacao com membros
- `GET /solicitacoes/?projeto_id=X` — lista solicitacoes do projeto

---

### US-SD-02 | Incluir membro na solicitacao de RH (8 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-03 - Inclusao, alteracao e encerramento de membros
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero incluir membros na solicitacao de RH para compor a equipe do projeto.

**BDD:** DADO que exista uma solicitacao em edicao, QUANDO o coordenador informar especialista, perfil, fonte e vigencia, ENTAO o membro deve ser incluido na proposta.

**Criterios de Aceitacao:**
- CA-01: O sistema deve permitir inclusao, alteracao e encerramento de membros
- CA-02: O sistema deve validar carga horaria maxima e regras de bolsas
- CA-03: O sistema deve registrar vigencia, fonte e perfil de cada vinculo

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-SD-02-01 | back | Endpoints CRUD para `Pesquisador_Projeto`: incluir, alterar e encerrar membro vinculado a versao de RH | Marcelo | 3 | [x] |
| 17 | TK-US-SD-02-02 | front | Formulario de inclusao de membro: busca especialista (mock), selecao de perfil/categoria, fonte, CH, vigencia | Vinicius | 3 | [ ] |
| 18 | TK-US-SD-02-03 | qa | Testar inclusao/alteracao/encerramento, validar dados persistidos em Pesquisador_Projeto | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #16:**
- `POST /solicitacoes/{id}/membros` — body: `{ pesquisador_id, categoria_bolsa, fonte_financiamento, carga_horaria_semanal, data_inicio, data_fim }`
- Calcular `valor_bolsa` automaticamente com base em `Parametro_Regra` vigente
- Vincular ao `versao_rh_id` da solicitacao
- `PUT /solicitacoes/{id}/membros/{vinculo_id}` — alterar dados do vinculo
- `DELETE /solicitacoes/{id}/membros/{vinculo_id}` — encerrar participacao
- Validar que a solicitacao esta em `status = "Em Edicao"`

---

## Fase 4 — Validacoes e Alteracao de RH

### US-SD-03 | Validar carga horaria e bolsa do membro (8 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-03 - Inclusao, alteracao e encerramento de membros
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero que o sistema valide carga horaria e bolsa para reduzir erros administrativos.

**BDD:** DADO que um membro foi informado, QUANDO a carga horaria ou categoria for alterada, ENTAO o sistema deve validar limites e informar inconsistencias.

**Criterios de Aceitacao:**
- CA-01: O sistema deve validar carga horaria maxima e regras de bolsas (Resolucao 11/2022)
- CA-02: O sistema deve registrar vigencia, fonte e perfil de cada vinculo

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-SD-03-01 | back | Servico de validacao: CH global do pesquisador (todos os projetos), calculo automatico de bolsa via Parametro_Regra, retorno de erros detalhados | Vinicius | 3 | [x] |
| 20 | TK-US-SD-03-02 | front | Exibir feedback de validacao em tempo real no formulario: alertas de CH excedida, valor calculado da bolsa | Lindomar | 3 | [ ] |
| 21 | TK-US-SD-03-03 | qa | Testar cenarios: CH no limite, CH excedida, categoria inexistente, calculo proporcional | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #19:**
- Servico `validar_carga_horaria(pesquisador_id, ch_semanal_nova, projeto_id)`:
  - Somar CH de todas as alocacoes ativas do pesquisador em todos os projetos
  - Comparar com `limite_semanal` de `Parametro_Regra`
  - Retornar erro se exceder
- Servico `calcular_bolsa(categoria_bolsa, ch_semanal, data_referencia)`:
  - Buscar `Parametro_Regra` com `tipo_regra = categoria_bolsa` e vigencia que contenha `data_referencia`
  - Calcular proporcional: `valor_bolsa = (ch_semanal / ch_referencia) * valor_bolsa_referencia`
- Integrar validacao nos endpoints de inclusao/alteracao de membro (Task #16)

---

### US-SD-04 | Criar solicitacao de alteracao de RH (8 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-02 - Solicitacao de alteracao de RH
**Prioridade:** Alta

**Descricao:** Como coordenador, quero abrir uma alteracao de RH para mudar uma equipe ja implantada.

**BDD:** DADO que exista uma versao vigente de RH, QUANDO o coordenador solicitar alteracao, ENTAO o sistema deve criar uma versao proposta separada da atual.

**Criterios de Aceitacao:**
- CA-01: A alteracao deve partir de uma versao de RH ja existente
- CA-02: O sistema deve permitir registrar motivo e dados alterados
- CA-03: A versao proposta deve ficar separada da versao atual ate homologacao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 22 | TK-US-SD-04-01 | back | Endpoint `POST /solicitacoes/` (tipo=Alteracao): clonar versao vigente como "Antes", criar nova versao "Depois" editavel | Marcelo | 3 | [ ] |
| 23 | TK-US-SD-04-02 | front | Tela de solicitacao de alteracao: exibir equipe atual, permitir edicoes na versao proposta | Lucas | 3 | [ ] |
| 24 | TK-US-SD-04-03 | qa | Testar criacao de alteracao, separacao Antes/Depois, edicao da versao proposta sem afetar a atual | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #22:**
- Ao criar solicitacao tipo "Alteracao":
  1. Buscar ultima `Versao_RH_Projeto` com `status = "Vigente"` do projeto
  2. Clonar todos os registros de `Pesquisador_Projeto` dessa versao como versao "Antes" (somente leitura)
  3. Criar nova `Versao_RH_Projeto` com `numero_versao = anterior + 1` e `status = "Proposta"`
  4. Clonar mesmos registros como base editavel da versao "Depois"
- O coordenador edita apenas a versao "Depois" (reutiliza endpoints de inclusao/alteracao/encerramento de membro)
- Manter campo de justificativa na `Solicitacao_RH`

---

## Fase 5 — Comparacao de Versoes

### US-SD-05 | Comparar equipe atual e proposta (5 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-04 - Versoes de RH e comparacao Atual x Proposta
**Prioridade:** Alta

**Descricao:** Como gestor, quero comparar equipe atual e proposta para entender as mudancas antes da homologacao.

**BDD:** DADO que exista uma versao atual e uma proposta, QUANDO o usuario abrir a comparacao, ENTAO o sistema deve exibir inclusoes, alteracoes e encerramentos.

**Criterios de Aceitacao:**
- CA-01: O sistema deve listar versoes de RH por projeto
- CA-02: O sistema deve comparar equipe atual e equipe proposta
- CA-03: As diferencas devem ser exibidas de forma clara para homologacao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 25 | TK-US-SD-05-01 | back | Endpoint `GET /solicitacoes/{id}/comparacao`: diff entre versao Antes e Depois, retornando listas de inclusoes, alteracoes e encerramentos | Vinicius | 3 | [x] |
| 26 | TK-US-SD-05-02 | front | Tela de comparacao lado a lado: destacar inclusoes (verde), alteracoes (amarelo), encerramentos (vermelho) | Lindomar | 3 | [ ] |
| 27 | TK-US-SD-05-03 | qa | Testar comparacao com cenarios: inclusao pura, encerramento puro, alteracao de CH/fonte, misto | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #25:**
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
- Agrupar membros por `fonte_financiamento` (ordem fixa: EMPRESA, EMBRAPII, SEBRAE, IFPB)
- Comparar por `pesquisador_id` + `fonte_financiamento` para detectar diferencas
- `GET /solicitacoes/{id}/versoes` — lista todas as versoes de RH da solicitacao

---

## Resumo de Carga por Responsavel

| Responsavel | Funcao | Tasks | Horas |
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
- [ ] Todas as tabelas do DER com migracoes Alembic (pendente: criar alembic/versions/)
- [x] Dados mockados populados (usuarios, projeto, parametros, pesquisadores)
- [x] Login/logout funcional com JWT
- [x] Menu dinamico por perfil (4 perfis)
- [ ] Criar solicitacao de implantacao vinculada a projeto (back [x] / front pendente)
- [ ] Incluir/alterar/encerrar membros em solicitacao (back [x] / front pendente)
- [ ] Validacao automatica de CH global e calculo de bolsa (back [x] / front pendente)
- [ ] Criar solicitacao de alteracao com versionamento Antes/Depois (back parcial: clonagem de membros pendente)
- [ ] Tela de comparacao de versoes com diferencas destacadas (back [x] / front pendente)
