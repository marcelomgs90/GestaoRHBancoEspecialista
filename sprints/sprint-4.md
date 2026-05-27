# Sprint 4 - Transferência e Parametrização

**Objetivo:** Finalizar transferências de RH entre projetos, parametrização administrativa e homologação integrada.

**Métricas:** 6 US | 24 Story Points | 48 horas estimadas

---

## Visão Geral das Fases

```
Fase 1: Transferência de RH     [US-TR-01, US-TR-02, US-TR-03]  ── fluxo completo de transferência
    |
Fase 2: Parametrização           [US-PA-01, US-PA-02]             ── módulo administrativo
    |
Fase 3: Consolidação Final       [US-AQ-05]                       ── evidências e entrega
```

---

## Fase 1 — Transferencia de RH

### US-TR-01 | Solicitar transferência de pesquisador (5 pts)

**Epic:** EP-06 Módulo Transferência de RH
**Feature:** F-TR-01 - Solicitação de transferência de RH
**Prioridade:** Imediata

**Descrição:** Como coordenador solicitante, quero pedir transferência de pesquisador entre projetos para reaproveitar especialistas.

**BDD:** DADO que exista pesquisador vinculado em projeto origem, QUANDO informar projeto destino e justificativa, ENTAO o sistema deve criar pendência de aceite.

**Critérios de Aceitação:**
- CA-01: A transferência deve indicar projeto origem, projeto destino e pesquisador
- CA-02: A transferência deve gerar pendência para o coordenador cedente
- CA-03: A solicitação deve manter status de acompanhamento

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-TR-01-01 | back | Endpoint `POST /transferencias/` com pesquisador_id, projeto_origem_id, projeto_destino_id; criar registro com status "Pendente"; notificar coordenador cedente | Marcelo | 3 | [ ] |
| 2 | TK-US-TR-01-02 | front | Tela de solicitação de transferência: seleção de pesquisador, projeto destino, justificativa | Lucas | 3 | [ ] |
| 3 | TK-US-TR-01-03 | qa | Testar criação de transferência, status pendente, dados persistidos | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #1:**
- Validar que pesquisador tem vínculo ativo no projeto_origem
- Validar regra dos 60 dias (Nota Técnica 01/2022): se projeto origem finalizado, transferência deve ocorrer até 60 dias após término
- Registrar `coordenador_cedente_id` automaticamente a partir do projeto origem
- Status: Pendente -> Aceita/Recusada

---

### US-TR-02 | Aceitar ou recusar transferência (5 pts)

**Epic:** EP-06 Módulo Transferência de RH
**Feature:** F-TR-02 - Aceite ou recusa pelo coordenador cedente
**Prioridade:** Imediata

**Descrição:** Como coordenador cedente, quero aceitar ou recusar transferência para controlar saída de pesquisador do meu projeto.

**BDD:** DADO que exista uma pendência de transferência, QUANDO o coordenador cedente aceitar ou recusar, ENTAO o sistema deve atualizar o status e registrar a decisão.

**Critérios de Aceitação:**
- CA-01: O coordenador cedente deve conseguir aceitar ou recusar a transferência
- CA-02: A recusa deve exigir justificativa
- CA-03: O aceite deve liberar a transferência para continuidade/homologação

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-TR-02-01 | back | Endpoint `PUT /transferencias/{id}/parecer` com ação (aceitar/recusar) e justificativa; ao aceitar, encerrar vínculo no projeto origem e criar vínculo no projeto destino | Vinicius | 3 | [ ] |
| 5 | TK-US-TR-02-02 | front | Tela de parecer: exibir detalhes da transferência, botões Aceitar/Recusar, campo de justificativa obrigatório na recusa | Lindomar | 3 | [ ] |
| 6 | TK-US-TR-02-03 | qa | Testar aceite (vínculo criado no destino, encerrado na origem), recusa (justificativa obrigatória), permissão do cedente | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #4:**
- Apenas o coordenador do projeto_origem (cedente) pode emitir parecer
- Ao aceitar:
  1. Atualizar status da transferência para "Aceita"
  2. Encerrar `Pesquisador_Projeto` no projeto origem (ajustar data_fim)
  3. Criar novo `Pesquisador_Projeto` no projeto destino
  4. Gerar nova versão de RH em ambos os projetos
- Ao recusar:
  1. Atualizar status para "Recusada"
  2. Registrar justificativa
  3. Manter vínculos inalterados

---

### US-TR-03 | Consultar histórico de transferências (3 pts)

**Epic:** EP-06 Módulo Transferência de RH
**Feature:** F-TR-03 - Histórico de transferências
**Prioridade:** Baixa

**Descrição:** Como gestor do Polo, quero consultar histórico de transferências para manter rastreabilidade administrativa.

**BDD:** DADO que existam transferências registradas, QUANDO aplicar filtros de status/projeto, ENTAO o sistema deve exibir histórico com datas e responsáveis.

**Critérios de Aceitação:**
- CA-01: O sistema deve listar transferências por status (Pendente, Aceita, Recusada)
- CA-02: O histórico deve preservar datas, responsáveis e justificativas
- CA-03: A consulta deve permitir rastrear a solicitação associada

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-TR-03-01 | back | Endpoint `GET /transferencias/?status=&projeto_id=` com filtros e paginação | Marcelo | 3 | [ ] |
| 8 | TK-US-TR-03-02 | front | Tela de histórico com filtros por status e projeto, tabela de resultados com detalhes | Lucas | 3 | [ ] |
| 9 | TK-US-TR-03-03 | qa | Testar filtros, dados exibidos, rastreabilidade | Carolina | 2 | [ ] |

---

## Fase 2 — Parametrização

### US-PA-01 | Cadastrar regra de carga horária e bolsa com vigência (5 pts)

**Epic:** EP-07 Módulo Parametrização
**Feature:** F-PA-01 - Parametrização de carga horária, bolsas e vigência
**Prioridade:** Alta

**Descrição:** Como administrador, quero cadastrar regras com vigência para controlar cálculos sem alterar código.

**BDD:** DADO que o administrador esteja no módulo de parametrização, QUANDO informar valores, limites e vigência, ENTAO a regra deve ser salva e validada.

**Critérios de Aceitação:**
- CA-01: O administrador deve cadastrar regras com vigência (vigencia_inicio, vigencia_fim)
- CA-02: Alterações novas não devem corromper cálculos históricos (vigência temporal)
- CA-03: Valores e limites devem ser validados antes de salvar

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-PA-01-01 | back | CRUD `Parametro_Regra`: endpoints com validação de sobreposição de vigência, impedir edição retroativa | Vinicius | 3 | [ ] |
| 11 | TK-US-PA-01-02 | front | Tela de parametrização: listagem de regras, formulário com tipo, valor, limites, vigência | Lindomar | 3 | [ ] |
| 12 | TK-US-PA-01-03 | qa | Testar criação, vigência, não-retroatividade, sobreposição | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #10:**
- `GET /parametros/` — listar com filtro por tipo_regra e status
- `POST /parametros/` — criar regra, validar que vigência não sobrepõe regra existente do mesmo tipo
- `PUT /parametros/{id}` — alterar apenas regras com vigencia_inicio futura (não retroativo)
- `DELETE /parametros/{id}` — inativar (soft delete via status)
- Apenas perfil ADMINISTRADOR tem acesso
- Valores de referência por categoria (docs/08):
  - Pesquisador Master 20h: R$ 4.585,00
  - Profissional Júnior 160h: R$ 5.484,80
  - Profissional Iniciante 80h: R$ 2.056,80
  - Estudante Nível Superior Avançado 80h: R$ 1.250,40

---

### US-PA-02 | Cadastrar tipos de solicitação/origem de RH (3 pts)

**Epic:** EP-07 Módulo Parametrização
**Feature:** F-PA-02 - Parametrização de tipos de solicitação/origem de RH
**Prioridade:** Normal

**Descrição:** Como administrador, quero manter tipos de solicitação/origem de RH para padronizar os fluxos do sistema.

**BDD:** DADO que o administrador tenha permissão, QUANDO cadastrar ou inativar um tipo, ENTAO o sistema deve refletir a mudança nos formulários.

**Critérios de Aceitação:**
- CA-01: O administrador deve manter tipos de solicitação/origem de RH
- CA-02: Tipos inativos não devem aparecer em novos cadastros
- CA-03: O sistema deve manter histórico de alterações de parametrização

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-PA-02-01 | back | CRUD para tipos de solicitação (Implantação, Alteração, Pagamento) e origens de RH, com soft delete | Marcelo | 3 | [ ] |
| 14 | TK-US-PA-02-02 | front | Tela de gestão de tipos: listagem, inclusão, inativação | Lucas | 3 | [ ] |
| 15 | TK-US-PA-02-03 | qa | Testar CRUD, tipos inativos ocultos em formulários, histórico | Carolina | 2 | [ ] |

---

## Fase 3 — Consolidacao Final

### US-AQ-05 | Consolidar bugs, melhorias e evidências finais (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-03 - Qualidade, evidências e apoio ao OpenProject
**Prioridade:** Baixa

**Descrição:** Como equipe, quero consolidar evidências finais e registrar bugs/melhorias para demonstrar rastreabilidade da entrega.

**BDD:** DADO que as sprints foram executadas, QUANDO finalizar a entrega, ENTAO o OpenProject deve conter evidências, bugs/melhorias e registros atualizados.

**Critérios de Aceitação:**
- CA-01: Cada US deve possuir evidência de teste ou validação
- CA-02: Bugs e melhorias devem ser registrados na versão correta
- CA-03: O PDF de evidências deve comprovar critérios, BDD, tasks, horas e responsáveis

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-AQ-05-01 | devops/doc | Preparar artefatos técnicos finais, consolidar testes e2e | Vinicius | 3 | [ ] |
| 17 | TK-US-AQ-05-02 | doc | Documentar evidências finais, atualizar OpenProject | Erick | 3 | [ ] |
| 18 | TK-US-AQ-05-03 | qa | Validar todas as evidências, rastreabilidade e PDF final | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsável

| Responsável | Função | Tasks | Horas |
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

- [ ] Solicitar transferência de pesquisador entre projetos
- [ ] Aceite/recusa pelo coordenador cedente com parecer
- [ ] Histórico de transferências com filtros e rastreabilidade
- [ ] Validação dos 60 dias para realocação (Nota Técnica 01/2022)
- [ ] CRUD de Parametro_Regra com vigência temporal (não retroativo)
- [ ] Gestão de tipos de solicitação/origem de RH
- [ ] Evidências finais consolidadas
- [ ] Bugs e melhorias registrados no OpenProject

---

## Checklist de Entrega Final do Projeto

- [ ] Todos os 6 módulos implementados e testados
- [ ] 29 US entregues com evidências
- [ ] PDFs gerados conforme layout padrão (Implantação, Alteração, Pagamento)
- [ ] Regras da Resolução 11/2022 codificadas via Parametro_Regra
- [ ] Integração com Banco de Especialistas funcional
- [ ] 4 perfis de acesso com permissões aplicadas
- [ ] Histórico de versões de RH preservado
- [ ] Transferências entre projetos com aceite digital
