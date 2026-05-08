# Sprint 4 - Transferencia e Parametrizacao

**Objetivo:** Finalizar transferencias de RH entre projetos, parametrizacao administrativa e homologacao integrada.

**Metricas:** 6 US | 24 Story Points | 48 horas estimadas

---

## Visao Geral das Fases

```
Fase 1: Transferencia de RH     [US-TR-01, US-TR-02, US-TR-03]  ── fluxo completo de transferencia
    |
Fase 2: Parametrizacao           [US-PA-01, US-PA-02]             ── modulo administrativo
    |
Fase 3: Consolidacao Final       [US-AQ-05]                       ── evidencias e entrega
```

---

## Fase 1 — Transferencia de RH

### US-TR-01 | Solicitar transferencia de pesquisador (5 pts)

**Epic:** EP-06 Modulo Transferencia de RH
**Feature:** F-TR-01 - Solicitacao de transferencia de RH
**Prioridade:** Imediata

**Descricao:** Como coordenador solicitante, quero pedir transferencia de pesquisador entre projetos para reaproveitar especialistas.

**BDD:** DADO que exista pesquisador vinculado em projeto origem, QUANDO informar projeto destino e justificativa, ENTAO o sistema deve criar pendencia de aceite.

**Criterios de Aceitacao:**
- CA-01: A transferencia deve indicar projeto origem, projeto destino e pesquisador
- CA-02: A transferencia deve gerar pendencia para o coordenador cedente
- CA-03: A solicitacao deve manter status de acompanhamento

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-TR-01-01 | back | Endpoint `POST /transferencias/` com pesquisador_id, projeto_origem_id, projeto_destino_id; criar registro com status "Pendente"; notificar coordenador cedente | Marcelo | 3 | [ ] |
| 2 | TK-US-TR-01-02 | front | Tela de solicitacao de transferencia: selecao de pesquisador, projeto destino, justificativa | Lucas | 3 | [ ] |
| 3 | TK-US-TR-01-03 | qa | Testar criacao de transferencia, status pendente, dados persistidos | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #1:**
- Validar que pesquisador tem vinculo ativo no projeto_origem
- Validar regra dos 60 dias (Nota Tecnica 01/2022): se projeto origem finalizado, transferencia deve ocorrer ate 60 dias apos termino
- Registrar `coordenador_cedente_id` automaticamente a partir do projeto origem
- Status: Pendente -> Aceita/Recusada

---

### US-TR-02 | Aceitar ou recusar transferencia (5 pts)

**Epic:** EP-06 Modulo Transferencia de RH
**Feature:** F-TR-02 - Aceite ou recusa pelo coordenador cedente
**Prioridade:** Imediata

**Descricao:** Como coordenador cedente, quero aceitar ou recusar transferencia para controlar saida de pesquisador do meu projeto.

**BDD:** DADO que exista uma pendencia de transferencia, QUANDO o coordenador cedente aceitar ou recusar, ENTAO o sistema deve atualizar o status e registrar a decisao.

**Criterios de Aceitacao:**
- CA-01: O coordenador cedente deve conseguir aceitar ou recusar a transferencia
- CA-02: A recusa deve exigir justificativa
- CA-03: O aceite deve liberar a transferencia para continuidade/homologacao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-TR-02-01 | back | Endpoint `PUT /transferencias/{id}/parecer` com acao (aceitar/recusar) e justificativa; ao aceitar, encerrar vinculo no projeto origem e criar vinculo no projeto destino | Vinicius | 3 | [ ] |
| 5 | TK-US-TR-02-02 | front | Tela de parecer: exibir detalhes da transferencia, botoes Aceitar/Recusar, campo de justificativa obrigatorio na recusa | Lindomar | 3 | [ ] |
| 6 | TK-US-TR-02-03 | qa | Testar aceite (vinculo criado no destino, encerrado na origem), recusa (justificativa obrigatoria), permissao do cedente | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #4:**
- Apenas o coordenador do projeto_origem (cedente) pode emitir parecer
- Ao aceitar:
  1. Atualizar status da transferencia para "Aceita"
  2. Encerrar `Pesquisador_Projeto` no projeto origem (ajustar data_fim)
  3. Criar novo `Pesquisador_Projeto` no projeto destino
  4. Gerar nova versao de RH em ambos os projetos
- Ao recusar:
  1. Atualizar status para "Recusada"
  2. Registrar justificativa
  3. Manter vinculos inalterados

---

### US-TR-03 | Consultar historico de transferencias (3 pts)

**Epic:** EP-06 Modulo Transferencia de RH
**Feature:** F-TR-03 - Historico de transferencias
**Prioridade:** Baixa

**Descricao:** Como gestor do Polo, quero consultar historico de transferencias para manter rastreabilidade administrativa.

**BDD:** DADO que existam transferencias registradas, QUANDO aplicar filtros de status/projeto, ENTAO o sistema deve exibir historico com datas e responsaveis.

**Criterios de Aceitacao:**
- CA-01: O sistema deve listar transferencias por status (Pendente, Aceita, Recusada)
- CA-02: O historico deve preservar datas, responsaveis e justificativas
- CA-03: A consulta deve permitir rastrear a solicitacao associada

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-TR-03-01 | back | Endpoint `GET /transferencias/?status=&projeto_id=` com filtros e paginacao | Marcelo | 3 | [ ] |
| 8 | TK-US-TR-03-02 | front | Tela de historico com filtros por status e projeto, tabela de resultados com detalhes | Lucas | 3 | [ ] |
| 9 | TK-US-TR-03-03 | qa | Testar filtros, dados exibidos, rastreabilidade | Carolina | 2 | [ ] |

---

## Fase 2 — Parametrizacao

### US-PA-01 | Cadastrar regra de carga horaria e bolsa com vigencia (5 pts)

**Epic:** EP-07 Modulo Parametrizacao
**Feature:** F-PA-01 - Parametrizacao de carga horaria, bolsas e vigencia
**Prioridade:** Alta

**Descricao:** Como administrador, quero cadastrar regras com vigencia para controlar calculos sem alterar codigo.

**BDD:** DADO que o administrador esteja no modulo de parametrizacao, QUANDO informar valores, limites e vigencia, ENTAO a regra deve ser salva e validada.

**Criterios de Aceitacao:**
- CA-01: O administrador deve cadastrar regras com vigencia (vigencia_inicio, vigencia_fim)
- CA-02: Alteracoes novas nao devem corromper calculos historicos (vigencia temporal)
- CA-03: Valores e limites devem ser validados antes de salvar

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-PA-01-01 | back | CRUD `Parametro_Regra`: endpoints com validacao de sobreposicao de vigencia, impedir edicao retroativa | Vinicius | 3 | [ ] |
| 11 | TK-US-PA-01-02 | front | Tela de parametrizacao: listagem de regras, formulario com tipo, valor, limites, vigencia | Lindomar | 3 | [ ] |
| 12 | TK-US-PA-01-03 | qa | Testar criacao, vigencia, nao-retroatividade, sobreposicao | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #10:**
- `GET /parametros/` — listar com filtro por tipo_regra e status
- `POST /parametros/` — criar regra, validar que vigencia nao sobrepoe regra existente do mesmo tipo
- `PUT /parametros/{id}` — alterar apenas regras com vigencia_inicio futura (nao retroativo)
- `DELETE /parametros/{id}` — inativar (soft delete via status)
- Apenas perfil ADMINISTRADOR tem acesso
- Valores de referencia por categoria (docs/08):
  - Pesquisador Master 20h: R$ 4.585,00
  - Profissional Junior 160h: R$ 5.484,80
  - Profissional Iniciante 80h: R$ 2.056,80
  - Estudante Nivel Superior Avancado 80h: R$ 1.250,40

---

### US-PA-02 | Cadastrar tipos de solicitacao/origem de RH (3 pts)

**Epic:** EP-07 Modulo Parametrizacao
**Feature:** F-PA-02 - Parametrizacao de tipos de solicitacao/origem de RH
**Prioridade:** Normal

**Descricao:** Como administrador, quero manter tipos de solicitacao/origem de RH para padronizar os fluxos do sistema.

**BDD:** DADO que o administrador tenha permissao, QUANDO cadastrar ou inativar um tipo, ENTAO o sistema deve refletir a mudanca nos formularios.

**Criterios de Aceitacao:**
- CA-01: O administrador deve manter tipos de solicitacao/origem de RH
- CA-02: Tipos inativos nao devem aparecer em novos cadastros
- CA-03: O sistema deve manter historico de alteracoes de parametrizacao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-PA-02-01 | back | CRUD para tipos de solicitacao (Implantacao, Alteracao, Pagamento) e origens de RH, com soft delete | Marcelo | 3 | [ ] |
| 14 | TK-US-PA-02-02 | front | Tela de gestao de tipos: listagem, inclusao, inativacao | Lucas | 3 | [ ] |
| 15 | TK-US-PA-02-03 | qa | Testar CRUD, tipos inativos ocultos em formularios, historico | Carolina | 2 | [ ] |

---

## Fase 3 — Consolidacao Final

### US-AQ-05 | Consolidar bugs, melhorias e evidencias finais (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-03 - Qualidade, evidencias e apoio ao OpenProject
**Prioridade:** Baixa

**Descricao:** Como equipe, quero consolidar evidencias finais e registrar bugs/melhorias para demonstrar rastreabilidade da entrega.

**BDD:** DADO que as sprints foram executadas, QUANDO finalizar a entrega, ENTAO o OpenProject deve conter evidencias, bugs/melhorias e registros atualizados.

**Criterios de Aceitacao:**
- CA-01: Cada US deve possuir evidencia de teste ou validacao
- CA-02: Bugs e melhorias devem ser registrados na versao correta
- CA-03: O PDF de evidencias deve comprovar criterios, BDD, tasks, horas e responsaveis

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-AQ-05-01 | devops/doc | Preparar artefatos tecnicos finais, consolidar testes e2e | Vinicius | 3 | [ ] |
| 17 | TK-US-AQ-05-02 | doc | Documentar evidencias finais, atualizar OpenProject | Erick | 3 | [ ] |
| 18 | TK-US-AQ-05-03 | qa | Validar todas as evidencias, rastreabilidade e PDF final | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsavel

| Responsavel | Funcao | Tasks | Horas |
|-------------|--------|-------|-------|
| Vinicius | back | #4, #10, #16 | 9h |
| Marcelo | back | #1, #7, #13 | 9h |
| Lindomar | front | #5, #11 | 6h |
| Lucas | front | #2, #8, #14 | 9h |
| Carolina | qa | #3, #6, #9, #12, #15, #18 | 12h |
| Erick | doc | #17 | 3h |
| **Total** | | **18 tasks** | **48h** |

---

## Checklist de Entrega da Sprint

- [ ] Solicitar transferencia de pesquisador entre projetos
- [ ] Aceite/recusa pelo coordenador cedente com parecer
- [ ] Historico de transferencias com filtros e rastreabilidade
- [ ] Validacao dos 60 dias para realocacao (Nota Tecnica 01/2022)
- [ ] CRUD de Parametro_Regra com vigencia temporal (nao retroativo)
- [ ] Gestao de tipos de solicitacao/origem de RH
- [ ] Evidencias finais consolidadas
- [ ] Bugs e melhorias registrados no OpenProject

---

## Checklist de Entrega Final do Projeto

- [ ] Todos os 6 modulos implementados e testados
- [ ] 29 US entregues com evidencias
- [ ] PDFs gerados conforme layout padrao (Implantacao, Alteracao, Pagamento)
- [ ] Regras da Resolucao 11/2022 codificadas via Parametro_Regra
- [ ] Integracao com Banco de Especialistas funcional
- [ ] 4 perfis de acesso com permissoes aplicadas
- [ ] Historico de versoes de RH preservado
- [ ] Transferencias entre projetos com aceite digital
