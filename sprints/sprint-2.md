# Sprint 2 - Projetos e Banco de Especialistas

**Objetivo:** Cadastrar projetos, anexos e consultar/vincular especialistas do Banco de Especialistas (AIE).

**Métricas:** 7 US | 31 Story Points | 56 horas estimadas

---

## Visão Geral das Fases

```
Fase 1: Migrações Sprint 2      [US-AQ-03]                    ── pré-requisito
    |
Fase 2: CRUD de Projetos        [US-PR-01, US-PR-02]          ── depende da Fase 1
    |
Fase 3: Anexos e Coordenador    [US-PR-03, US-PR-04]          ── depende da Fase 2
    |
Fase 4: Banco de Especialistas  [US-BE-01, US-BE-02]          ── depende da Fase 2
```

---

## Fase 1 — Migrações da Sprint 2

### US-AQ-03 | Evoluir DER e migrações da Sprint 2 (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-02 - Modelagem do banco de dados e migrações
**Prioridade:** Baixa

**Descrição:** Como equipe técnica, quero evoluir o banco para projetos, anexos e vínculos para suportar as features da Sprint 2.

**BDD:** DADO que a base inicial existe, QUANDO forem aplicadas novas migrações, ENTAO projetos, anexos e vínculos devem ser armazenados corretamente.

**Critérios de Aceitação:**
- CA-01: As tabelas principais devem possuir migrações iniciais
- CA-02: As relações devem seguir o DER revisado

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-AQ-03-01 | devops/doc | Criar/evoluir migrações Alembic para tabelas de Projeto, Projeto_Anexo e ajustes em Pesquisador_Projeto | Marcelo | 3 | [ ] |
| 2 | TK-US-AQ-03-02 | doc | Documentar evolução do banco e evidências | Erick | 3 | [ ] |
| 3 | TK-US-AQ-03-03 | qa | Validar migrações, relações FK e integridade dos dados | Carolina | 2 | [ ] |

---

## Fase 2 — CRUD de Projetos

### US-PR-01 | Cadastrar projeto (5 pts)

**Epic:** EP-03 Módulo Projetos e Anexos
**Feature:** F-PR-01 - Cadastro e manutenção de projetos
**Prioridade:** Imediata

**Descrição:** Como gestor do Polo, quero cadastrar projetos para que solicitações de RH sejam vinculadas corretamente.

**BDD:** DADO que o usuário tenha permissão, QUANDO preencher os dados obrigatórios do projeto, ENTAO o sistema deve salvar o projeto ativo.

**Critérios de Aceitação:**
- CA-01: O projeto deve possuir dados básicos obrigatórios (título, data_inicio, data_fim)
- CA-02: O sistema deve permitir consulta, inclusão e alteração de projeto
- CA-03: Projetos inativos não devem aparecer como opção principal para novas solicitações

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-PR-01-01 | back | Endpoint `POST /projetos/`, validação de campos obrigatórios, coordenador_id via token | Marcelo | 3 | [ ] |
| 5 | TK-US-PR-01-02 | front | Tela de cadastro de projeto: formulário com título, datas, status | Lucas | 3 | [ ] |
| 6 | TK-US-PR-01-03 | qa | Testar cadastro com dados válidos/inválidos, verificar persistência | Carolina | 2 | [ ] |

---

### US-PR-02 | Consultar e alterar projeto (3 pts)

**Epic:** EP-03 Módulo Projetos e Anexos
**Feature:** F-PR-01 - Cadastro e manutenção de projetos
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero consultar e alterar projetos para manter dados atualizados.

**BDD:** DADO que existam projetos cadastrados, QUANDO o usuário pesquisar e editar um projeto, ENTAO as alterações válidas devem ser persistidas.

**Critérios de Aceitação:**
- CA-01: O projeto deve possuir dados básicos obrigatórios
- CA-02: O sistema deve permitir consulta, inclusão e alteração de projeto

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-PR-02-01 | back | Endpoints `GET /projetos/`, `GET /projetos/{id}`, `PUT /projetos/{id}` com filtros por status | Vinicius | 3 | [ ] |
| 8 | TK-US-PR-02-02 | front | Tela de listagem com busca/filtro e edição de projeto existente | Lindomar | 3 | [ ] |
| 9 | TK-US-PR-02-03 | qa | Testar consulta, filtros, edição e validação de campos obrigatórios | Carolina | 2 | [ ] |

---

## Fase 3 — Anexos e Coordenador

### US-PR-03 | Gerenciar anexos múltiplos do projeto (5 pts)

**Epic:** EP-03 Módulo Projetos e Anexos
**Feature:** F-PR-02 - Anexos múltiplos do projeto
**Prioridade:** Normal

**Descrição:** Como apoio coordenador, quero anexar documentos do projeto para manter o processo completo.

**BDD:** DADO que o projeto esteja cadastrado, QUANDO o usuário anexar arquivos, ENTAO o sistema deve registrar tipo, data e arquivo para consulta.

**Critérios de Aceitação:**
- CA-01: O sistema deve permitir múltiplos anexos por projeto
- CA-02: Cada anexo deve possuir tipo, data e arquivo associado
- CA-03: A lista de anexos deve permitir consulta posterior

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-PR-03-01 | back | Endpoints `POST /projetos/{id}/anexos` (upload), `GET /projetos/{id}/anexos`, `DELETE /projetos/{id}/anexos/{anexo_id}` | Marcelo | 3 | [ ] |
| 11 | TK-US-PR-03-02 | front | Componente de upload com seleção de tipo_documento, listagem de anexos com download | Lucas | 3 | [ ] |
| 12 | TK-US-PR-03-03 | qa | Testar upload de diferentes tipos, listagem e download | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #10:**
- Tipos de documento: Plano de Trabalho, Acordo de Parceria, Extrato DO, Aditivo
- Armazenamento em filesystem local (caminho_arquivo)
- Registrar em `Projeto_Anexo`: tipo_documento, numero_documento, caminho_arquivo, data_upload

---

### US-PR-04 | Vincular coordenador/especialista responsável pelo projeto (5 pts)

**Epic:** EP-03 Módulo Projetos e Anexos
**Feature:** F-PR-03 - Vinculação de coordenador/especialista ao projeto
**Prioridade:** Alta

**Descrição:** Como gestor do Polo, quero vincular o coordenador/especialista responsável para identificar o responsável pelo projeto.

**BDD:** DADO que o projeto e especialista existam, QUANDO o gestor confirmar a vinculação, ENTAO o projeto deve registrar o responsável vigente.

**Critérios de Aceitação:**
- CA-01: O coordenador/especialista deve ser localizado no Banco de Especialistas
- CA-02: A vinculação deve registrar papel e vigência
- CA-03: O sistema deve impedir vínculo duplicado ativo para a mesma função quando aplicável

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-PR-04-01 | back | Endpoint `PUT /projetos/{id}/coordenador` com validação de duplicidade e vigência | Vinicius | 3 | [ ] |
| 14 | TK-US-PR-04-02 | front | Componente de busca e seleção de especialista para vincular como coordenador | Lindomar | 3 | [ ] |
| 15 | TK-US-PR-04-03 | qa | Testar vinculação, duplicidade e troca de coordenador | Carolina | 2 | [ ] |

---

## Fase 4 — Banco de Especialistas

### US-BE-01 | Consultar especialista (5 pts)

**Epic:** EP-04 Módulo Banco de Especialistas e Vínculos
**Feature:** F-BE-01 - Consulta ao Banco de Especialistas
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero consultar o Banco de Especialistas para localizar pesquisadores aptos.

**BDD:** DADO que exista uma base de especialistas disponível, QUANDO pesquisar por nome, matrícula ou perfil, ENTAO o sistema deve listar resultados compatíveis.

**Critérios de Aceitação:**
- CA-01: A consulta deve permitir buscar especialista por nome, matrícula/identificador ou perfil
- CA-02: A consulta deve retornar dados mínimos necessários para vinculação
- CA-03: Ausência de resultado deve gerar mensagem clara ao usuário

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-BE-01-01 | back | Serviço de integração com API externa do Banco de Especialistas (AIE), endpoint `GET /especialistas/?q=` com filtros | Vinicius | 3 | [ ] |
| 17 | TK-US-BE-01-02 | front | Tela de busca de especialista com campo de pesquisa e listagem de resultados | Lindomar | 3 | [ ] |
| 18 | TK-US-BE-01-03 | qa | Testar busca com resultados, sem resultados e com API indisponível | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #16:**
- Integração somente leitura com API externa
- Dados retornados: ref_pesquisador, nome, tipo_vinculo, área_especialidade, instituição, situação
- Implementar fallback/cache para indisponibilidade da API
- Na Sprint 1 os dados eram mockados; agora integrar com API real

---

### US-BE-02 | Vincular pesquisador ao projeto (5 pts)

**Epic:** EP-04 Módulo Banco de Especialistas e Vínculos
**Feature:** F-BE-02 - Vinculação de pesquisador ao projeto
**Prioridade:** Alta

**Descrição:** Como coordenador, quero vincular pesquisador ao projeto para montar a equipe de RH.

**BDD:** DADO que o pesquisador foi localizado, QUANDO informar projeto, perfil, origem, fonte e vigência, ENTAO o vínculo deve ser registrado.

**Critérios de Aceitação:**
- CA-01: A vinculação deve exigir projeto, especialista, perfil, fonte e vigência
- CA-02: A origem de RH deve ser informada conforme tipos cadastrados
- CA-03: O sistema deve registrar histórico da vinculação

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-BE-02-01 | back | Endpoint `POST /projetos/{id}/vinculos` com validação de pesquisador na AIE, registro em Pesquisador_Projeto | Marcelo | 3 | [ ] |
| 20 | TK-US-BE-02-02 | front | Formulário de vinculação: pesquisador selecionado, perfil, fonte, CH, vigência | Lucas | 3 | [ ] |
| 21 | TK-US-BE-02-03 | qa | Testar vinculação completa, campos obrigatórios, histórico | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsável

| Responsável | Função | Tasks | Horas |
|-------------|--------|-------|-------|
| Vinicius | back | #7, #13, #16 | 9h |
| Marcelo | back | #1, #4, #10, #19 | 12h |
| Lindomar | front | #8, #14, #17 | 9h |
| Lucas | front | #5, #11, #20 | 9h |
| Carolina | qa | #3, #6, #9, #12, #15, #18, #21 | 14h |
| Erick | doc | #2 | 3h |
| **Total** | | **21 tasks** | **56h** |

---

## Checklist de Entrega da Sprint

- [ ] Migrações Alembic evoluídas para Projeto_Anexo e ajustes
- [ ] CRUD completo de projetos (cadastrar, consultar, alterar)
- [ ] Upload e gestão de anexos múltiplos por projeto
- [ ] Vinculação de coordenador ao projeto com validação
- [ ] Integração com API do Banco de Especialistas (busca real)
- [ ] Vinculação de pesquisador ao projeto com perfil, fonte e vigência
- [ ] Histórico de vinculações registrado
