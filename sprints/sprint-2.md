# Sprint 2 - Projetos e Banco de Especialistas

**Objetivo:** Cadastrar projetos, anexos e consultar/vincular especialistas do Banco de Especialistas (AIE).

**Metricas:** 7 US | 31 Story Points | 56 horas estimadas

---

## Visao Geral das Fases

```
Fase 1: Migracoes Sprint 2      [US-AQ-03]                    ── pre-requisito
    |
Fase 2: CRUD de Projetos        [US-PR-01, US-PR-02]          ── depende da Fase 1
    |
Fase 3: Anexos e Coordenador    [US-PR-03, US-PR-04]          ── depende da Fase 2
    |
Fase 4: Banco de Especialistas  [US-BE-01, US-BE-02]          ── depende da Fase 2
```

---

## Fase 1 — Migracoes da Sprint 2

### US-AQ-03 | Evoluir DER e migracoes da Sprint 2 (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-02 - Modelagem do banco de dados e migracoes
**Prioridade:** Baixa

**Descricao:** Como equipe tecnica, quero evoluir o banco para projetos, anexos e vinculos para suportar as features da Sprint 2.

**BDD:** DADO que a base inicial existe, QUANDO forem aplicadas novas migracoes, ENTAO projetos, anexos e vinculos devem ser armazenados corretamente.

**Criterios de Aceitacao:**
- CA-01: As tabelas principais devem possuir migracoes iniciais
- CA-02: As relacoes devem seguir o DER revisado

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-AQ-03-01 | devops/doc | Criar/evoluir migracoes Alembic para tabelas de Projeto, Projeto_Anexo e ajustes em Pesquisador_Projeto | Marcelo | 3 | [ ] |
| 2 | TK-US-AQ-03-02 | doc | Documentar evolucao do banco e evidencias | Erick | 3 | [ ] |
| 3 | TK-US-AQ-03-03 | qa | Validar migracoes, relacoes FK e integridade dos dados | Carolina | 2 | [ ] |

---

## Fase 2 — CRUD de Projetos

### US-PR-01 | Cadastrar projeto (5 pts)

**Epic:** EP-03 Modulo Projetos e Anexos
**Feature:** F-PR-01 - Cadastro e manutencao de projetos
**Prioridade:** Imediata

**Descricao:** Como gestor do Polo, quero cadastrar projetos para que solicitacoes de RH sejam vinculadas corretamente.

**BDD:** DADO que o usuario tenha permissao, QUANDO preencher os dados obrigatorios do projeto, ENTAO o sistema deve salvar o projeto ativo.

**Criterios de Aceitacao:**
- CA-01: O projeto deve possuir dados basicos obrigatorios (titulo, data_inicio, data_fim)
- CA-02: O sistema deve permitir consulta, inclusao e alteracao de projeto
- CA-03: Projetos inativos nao devem aparecer como opcao principal para novas solicitacoes

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-PR-01-01 | back | Endpoint `POST /projetos/`, validacao de campos obrigatorios, coordenador_id via token | Marcelo | 3 | [ ] |
| 5 | TK-US-PR-01-02 | front | Tela de cadastro de projeto: formulario com titulo, datas, status | Lucas | 3 | [ ] |
| 6 | TK-US-PR-01-03 | qa | Testar cadastro com dados validos/invalidos, verificar persistencia | Carolina | 2 | [ ] |

---

### US-PR-02 | Consultar e alterar projeto (3 pts)

**Epic:** EP-03 Modulo Projetos e Anexos
**Feature:** F-PR-01 - Cadastro e manutencao de projetos
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero consultar e alterar projetos para manter dados atualizados.

**BDD:** DADO que existam projetos cadastrados, QUANDO o usuario pesquisar e editar um projeto, ENTAO as alteracoes validas devem ser persistidas.

**Criterios de Aceitacao:**
- CA-01: O projeto deve possuir dados basicos obrigatorios
- CA-02: O sistema deve permitir consulta, inclusao e alteracao de projeto

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-PR-02-01 | back | Endpoints `GET /projetos/`, `GET /projetos/{id}`, `PUT /projetos/{id}` com filtros por status | Vinicius | 3 | [ ] |
| 8 | TK-US-PR-02-02 | front | Tela de listagem com busca/filtro e edicao de projeto existente | Lindomar | 3 | [ ] |
| 9 | TK-US-PR-02-03 | qa | Testar consulta, filtros, edicao e validacao de campos obrigatorios | Carolina | 2 | [ ] |

---

## Fase 3 — Anexos e Coordenador

### US-PR-03 | Gerenciar anexos multiplos do projeto (5 pts)

**Epic:** EP-03 Modulo Projetos e Anexos
**Feature:** F-PR-02 - Anexos multiplos do projeto
**Prioridade:** Normal

**Descricao:** Como apoio coordenador, quero anexar documentos do projeto para manter o processo completo.

**BDD:** DADO que o projeto esteja cadastrado, QUANDO o usuario anexar arquivos, ENTAO o sistema deve registrar tipo, data e arquivo para consulta.

**Criterios de Aceitacao:**
- CA-01: O sistema deve permitir multiplos anexos por projeto
- CA-02: Cada anexo deve possuir tipo, data e arquivo associado
- CA-03: A lista de anexos deve permitir consulta posterior

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-PR-03-01 | back | Endpoints `POST /projetos/{id}/anexos` (upload), `GET /projetos/{id}/anexos`, `DELETE /projetos/{id}/anexos/{anexo_id}` | Marcelo | 3 | [ ] |
| 11 | TK-US-PR-03-02 | front | Componente de upload com selecao de tipo_documento, listagem de anexos com download | Lucas | 3 | [ ] |
| 12 | TK-US-PR-03-03 | qa | Testar upload de diferentes tipos, listagem e download | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #10:**
- Tipos de documento: Plano de Trabalho, Acordo de Parceria, Extrato DO, Aditivo
- Armazenamento em filesystem local (caminho_arquivo)
- Registrar em `Projeto_Anexo`: tipo_documento, numero_documento, caminho_arquivo, data_upload

---

### US-PR-04 | Vincular coordenador/especialista responsavel pelo projeto (5 pts)

**Epic:** EP-03 Modulo Projetos e Anexos
**Feature:** F-PR-03 - Vinculacao de coordenador/especialista ao projeto
**Prioridade:** Alta

**Descricao:** Como gestor do Polo, quero vincular o coordenador/especialista responsavel para identificar o responsavel pelo projeto.

**BDD:** DADO que o projeto e especialista existam, QUANDO o gestor confirmar a vinculacao, ENTAO o projeto deve registrar o responsavel vigente.

**Criterios de Aceitacao:**
- CA-01: O coordenador/especialista deve ser localizado no Banco de Especialistas
- CA-02: A vinculacao deve registrar papel e vigencia
- CA-03: O sistema deve impedir vinculo duplicado ativo para a mesma funcao quando aplicavel

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-PR-04-01 | back | Endpoint `PUT /projetos/{id}/coordenador` com validacao de duplicidade e vigencia | Vinicius | 3 | [ ] |
| 14 | TK-US-PR-04-02 | front | Componente de busca e selecao de especialista para vincular como coordenador | Lindomar | 3 | [ ] |
| 15 | TK-US-PR-04-03 | qa | Testar vinculacao, duplicidade e troca de coordenador | Carolina | 2 | [ ] |

---

## Fase 4 — Banco de Especialistas

### US-BE-01 | Consultar especialista (5 pts)

**Epic:** EP-04 Modulo Banco de Especialistas e Vinculos
**Feature:** F-BE-01 - Consulta ao Banco de Especialistas
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero consultar o Banco de Especialistas para localizar pesquisadores aptos.

**BDD:** DADO que exista uma base de especialistas disponivel, QUANDO pesquisar por nome, matricula ou perfil, ENTAO o sistema deve listar resultados compativeis.

**Criterios de Aceitacao:**
- CA-01: A consulta deve permitir buscar especialista por nome, matricula/identificador ou perfil
- CA-02: A consulta deve retornar dados minimos necessarios para vinculacao
- CA-03: Ausencia de resultado deve gerar mensagem clara ao usuario

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-BE-01-01 | back | Servico de integracao com API externa do Banco de Especialistas (AIE), endpoint `GET /especialistas/?q=` com filtros | Vinicius | 3 | [ ] |
| 17 | TK-US-BE-01-02 | front | Tela de busca de especialista com campo de pesquisa e listagem de resultados | Lindomar | 3 | [ ] |
| 18 | TK-US-BE-01-03 | qa | Testar busca com resultados, sem resultados e com API indisponivel | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #16:**
- Integracao somente leitura com API externa
- Dados retornados: ref_pesquisador, nome, tipo_vinculo, area_especialidade, instituicao, situacao
- Implementar fallback/cache para indisponibilidade da API
- Na Sprint 1 os dados eram mockados; agora integrar com API real

---

### US-BE-02 | Vincular pesquisador ao projeto (5 pts)

**Epic:** EP-04 Modulo Banco de Especialistas e Vinculos
**Feature:** F-BE-02 - Vinculacao de pesquisador ao projeto
**Prioridade:** Alta

**Descricao:** Como coordenador, quero vincular pesquisador ao projeto para montar a equipe de RH.

**BDD:** DADO que o pesquisador foi localizado, QUANDO informar projeto, perfil, origem, fonte e vigencia, ENTAO o vinculo deve ser registrado.

**Criterios de Aceitacao:**
- CA-01: A vinculacao deve exigir projeto, especialista, perfil, fonte e vigencia
- CA-02: A origem de RH deve ser informada conforme tipos cadastrados
- CA-03: O sistema deve registrar historico da vinculacao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-BE-02-01 | back | Endpoint `POST /projetos/{id}/vinculos` com validacao de pesquisador na AIE, registro em Pesquisador_Projeto | Marcelo | 3 | [ ] |
| 20 | TK-US-BE-02-02 | front | Formulario de vinculacao: pesquisador selecionado, perfil, fonte, CH, vigencia | Lucas | 3 | [ ] |
| 21 | TK-US-BE-02-03 | qa | Testar vinculacao completa, campos obrigatorios, historico | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsavel

| Responsavel | Funcao | Tasks | Horas |
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

- [ ] Migracoes Alembic evoluidas para Projeto_Anexo e ajustes
- [ ] CRUD completo de projetos (cadastrar, consultar, alterar)
- [ ] Upload e gestao de anexos multiplos por projeto
- [ ] Vinculacao de coordenador ao projeto com validacao
- [ ] Integracao com API do Banco de Especialistas (busca real)
- [ ] Vinculacao de pesquisador ao projeto com perfil, fonte e vigencia
- [ ] Historico de vinculacoes registrado
