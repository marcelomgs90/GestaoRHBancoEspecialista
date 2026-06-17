# Sprint 3 - Monitoramento e Documentos

**Objetivo:** Emitir documentos PDF padronizados, solicitação de pagamento e consultas/relatórios consolidados.

**Métricas:** 7 US | 31 Story Points | 56 horas estimadas

---

## Visão Geral das Fases

```
Fase 1: Pagamento por Competência  [US-SD-06]                    ── base para PDF de pagamento
    |
Fase 2: Geração de PDFs           [US-SD-07, US-SD-08, US-SD-09] ── depende dos dados das Sprints 1-2
    |
Fase 3: Monitoramento/Relatórios  [US-MO-01, US-MO-02]           ── depende dos vínculos cadastrados
    |
Fase 4: Evidências                [US-AQ-04]                      ── pós-implementação
```

---

## Fase 1 — Pagamento por Competencia

### US-SD-06 | Criar solicitação de pagamento por competência (5 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-05 - Solicitação de pagamento de RH por mês/ano
**Prioridade:** Alta

**Descrição:** Como coordenador, quero solicitar pagamento de RH por mês e ano para gerar a documentação da competência.

**BDD:** DADO que exista equipe vigente, QUANDO o coordenador informar mês e ano, ENTAO o sistema deve listar membros ativos e valores da competência.

**Critérios de Aceitação:**
- CA-01: A solicitação de pagamento deve exigir mês e ano de referência
- CA-02: O sistema deve listar somente membros ativos na competência
- CA-03: O pagamento deve considerar fonte e carga horária vigente

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-SD-06-01 | back | Endpoint `POST /solicitacoes/` (tipo=Pagamento) com mes_ano, listar membros ativos no período, calcular valores por fonte | Vinicius | 3 | [ ] |
| 2 | TK-US-SD-06-02 | front | Tela de solicitação de pagamento: seleção de mês/ano, listagem de membros ativos com valores | Lindomar | 3 | [ ] |
| 3 | TK-US-SD-06-03 | qa | Testar filtragem por competência, membros fora do período, cálculo de valores | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #1:**
- Filtrar `Pesquisador_Projeto` onde `data_inicio <= ultimo_dia_mes` e `data_fim >= primeiro_dia_mes`
- Agrupar por fonte_financiamento
- Calcular valor mensal com base na CH e Parametro_Regra vigente

---

## Fase 2 — Geração de PDFs

> **Referência:** docs/08-guia-implantacao-alteracao-rh.md (estrutura exata dos PDFs)

### US-SD-07 | Gerar PDF de implantação inicial (5 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero gerar PDF de implantação inicial para anexar ao processo administrativo.

**BDD:** DADO que a implantação inicial esteja válida, QUANDO o usuário acionar a emissão, ENTAO o PDF deve ser gerado no padrão definido.

**Critérios de Aceitação:**
- CA-01: O sistema deve gerar PDF de implantação inicial conforme layout padrão

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-SD-07-01 | back | Módulo de geração de PDF de implantação: cabeçalho, tabelas por fonte (EMPRESA/EMBRAPII/SEBRAE), totais, justificativa, assinatura | Marcelo | 3 | [ ] |
| 5 | TK-US-SD-07-02 | front | Botão "Gerar PDF" na tela de solicitação, download do arquivo | Lucas | 3 | [ ] |
| 6 | TK-US-SD-07-03 | qa | Validar PDF gerado contra layout de referência (docs/08), conferir valores e formatação | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #4:**
- Estrutura do PDF conforme docs/08-guia-implantacao-alteracao-rh.md Seção 1:
  - Cabeçalho: Projeto, Código, Solicitação No., Data
  - Título: "SOLICITAÇÃO DE RH: IMPLANTAÇÃO DE RH"
  - Seção 1: tabelas por fonte (1.1 EMPRESA, 1.2 EMBRAPII, 1.3 SEBRAE)
  - Colunas: Nome, CPF (oculto em EMPRESA), Função/Categoria, CH Mensal, Bolsa mensal, Qtd. Meses, Início, Total
  - Seção 2: Justificativa
  - Bloco de assinatura do coordenador
- Formato monetário: R$ X.XXX,XX
- Datas: DD/MM/AAAA
- Módulo isolado da lógica de negócio (conforme CLAUDE.md)

---

### US-SD-08 | Gerar PDF de alteração de RH (5 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero gerar PDF de alteração de RH com estado atual e proposto para formalizar mudanças.

**BDD:** DADO que exista alteração de RH validada, QUANDO o usuário emitir o documento, ENTAO o PDF deve apresentar as informações antes e depois.

**Critérios de Aceitação:**
- CA-01: O sistema deve gerar PDF de alteração de RH
- CA-02: O sistema deve comparar equipe atual e equipe proposta
- CA-03: As diferenças devem ser exibidas de forma clara

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-SD-08-01 | back | Módulo de geração de PDF de alteração: Seção Atual (Antes), Seção Alterações Solicitadas, Seção Nova (Depois), justificativa | Vinicius | 3 | [ ] |
| 8 | TK-US-SD-08-02 | front | Botão "Gerar PDF de Alteração" com preview e download | Lindomar | 3 | [ ] |
| 9 | TK-US-SD-08-03 | qa | Validar PDF com cenários: balanceamento financeiro, inclusão, saída, troca de função | Carolina | 2 | [ ] |

**Detalhamento técnico da Task #7:**
- Estrutura conforme docs/08, Seção 1.2:
  - Seção 1: RH Atual (Antes) — tabelas por fonte com histórico completo
  - Seção 2: Alterações Solicitadas — tabela resumo (Bolsista, Perfil, CH, Valor Hora, Valor Bolsa, Alteração)
  - Seção 3: RH a partir de [mês/ano] (Depois) — tabelas por fonte com nova composição
  - Seção 4: Justificativa
- Reutilizar componentes do módulo de PDF de implantação para tabelas por fonte
- Tipos de alteração: balanceamento financeiro, redução CH, inclusão, saída, troca função, migração categoria, transferência

---

### US-SD-09 | Gerar PDF de folha/solicitação de pagamento (5 pts)

**Epic:** EP-02 Módulo Solicitações e Documentos
**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados
**Prioridade:** Alta

**Descrição:** Como coordenador, quero gerar PDF de folha de pagamento para a competência selecionada.

**BDD:** DADO que a solicitação de pagamento foi calculada, QUANDO o usuário emitir o documento, ENTAO o PDF deve listar membros, fonte, horas e valores.

**Critérios de Aceitação:**
- CA-01: O sistema deve gerar PDF de folha/solicitação de pagamento
- CA-02: A solicitação de pagamento deve exigir mês e ano de referência
- CA-03: O sistema deve listar somente membros ativos na competência

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-SD-09-01 | back | Módulo de geração de PDF de pagamento: membros ativos no mês/ano, valores por fonte, totais | Marcelo | 3 | [ ] |
| 11 | TK-US-SD-09-02 | front | Botão "Gerar PDF de Pagamento" na tela de solicitação | Lucas | 3 | [ ] |
| 12 | TK-US-SD-09-03 | qa | Validar PDF de pagamento, conferir membros e valores da competência | Carolina | 2 | [ ] |

---

## Fase 3 — Monitoramento e Relatórios

### US-MO-01 | Consultar alocação por projeto, fonte e perfil (5 pts)

**Epic:** EP-05 Módulo Monitoramento
**Feature:** F-MO-01 - Consulta e relatório de alocação por projeto, fonte e perfil
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero consultar alocação por projeto, fonte e perfil para acompanhar a composição das equipes.

**BDD:** DADO que existam vínculos cadastrados, QUANDO aplicar filtros de projeto, fonte ou perfil, ENTAO o relatório deve exibir os dados vigentes.

**Critérios de Aceitação:**
- CA-01: O relatório deve permitir filtrar por projeto, fonte e perfil
- CA-02: O relatório deve permitir exportar/visualizar dados consolidados
- CA-03: Os dados devem refletir a versão vigente de RH

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-MO-01-01 | back | Endpoint `GET /monitoramento/alocacoes?projeto_id=&fonte=&perfil=` com filtros combinados e dados da versão vigente | Vinicius | 3 | [ ] |
| 14 | TK-US-MO-01-02 | front | Tela de relatório com filtros de projeto/fonte/perfil, tabela de resultados | Lindomar | 3 | [ ] |
| 15 | TK-US-MO-01-03 | qa | Testar combinações de filtros, dados retornados vs versão vigente | Carolina | 2 | [ ] |

---

### US-MO-02 | Visualizar consolidação por fonte (3 pts)

**Epic:** EP-05 Módulo Monitoramento
**Feature:** F-MO-02 - Visão consolidada por fonte de financiamento
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero visualizar a distribuição por fonte de financiamento para acompanhar EMBRAPII, EMPRESA e SEBRAE.

**BDD:** DADO que existam vínculos com fontes cadastradas, QUANDO abrir a visão consolidada, ENTAO o sistema deve apresentar totais separados por fonte.

**Critérios de Aceitação:**
- CA-01: A visão deve separar fontes EMBRAPII, EMPRESA e SEBRAE
- CA-02: O sistema deve apresentar totais por fonte (CH total, valor total, qtd pesquisadores)
- CA-03: A consulta deve considerar apenas vínculos ativos ou vigentes no filtro

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-MO-02-01 | back | Endpoint `GET /monitoramento/consolidado-fonte?projeto_id=` com somatórios por fonte | Marcelo | 3 | [ ] |
| 17 | TK-US-MO-02-02 | front | Dashboard consolidado por fonte com cards/gráficos de totais | Lucas | 3 | [ ] |
| 18 | TK-US-MO-02-03 | qa | Testar totais por fonte, verificar vínculos inativos excluídos | Carolina | 2 | [ ] |

---

## Fase 4 — Evidencias

### US-AQ-04 | Registrar evidências de testes da Sprint 3 (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-03 - Qualidade, evidências e apoio ao OpenProject
**Prioridade:** Baixa

**Descrição:** Como QA, quero registrar evidências de testes para comprovar a execução das US da sprint.

**BDD:** DADO que as US estejam implementadas, QUANDO os testes forem realizados, ENTAO as evidências devem ser organizadas para entrega.

**Critérios de Aceitação:**
- CA-01: Cada US deve possuir evidência de teste ou validação
- CA-02: O PDF de evidências deve comprovar critérios, BDD, tasks, horas e responsáveis

#### Tasks

| # | Task ID | Tipo | Descrição | Responsável | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-AQ-04-01 | devops/doc | Preparar artefatos técnicos e evidências | Vinicius | 3 | [ ] |
| 20 | TK-US-AQ-04-02 | doc | Documentar evidências e configuração | Erick | 3 | [ ] |
| 21 | TK-US-AQ-04-03 | qa | Validar evidências e rastreabilidade | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsável

| Responsável | Função | Tasks | Horas |
|-------------|--------|-------|-------|
| Vinicius | back | #1, #7, #13, #19 | 12h |
| Marcelo | back | #4, #10, #16 | 9h |
| Lindomar | front | #2, #8, #14 | 9h |
| Lucas | front | #5, #11, #17 | 9h |
| Carolina | qa | #3, #6, #9, #12, #15, #18, #21 | 14h |
| Erick | doc | #20 | 3h |
| **Total** | | **21 tasks** | **56h** |

---

## Checklist de Entrega da Sprint

- [ ] Solicitação de pagamento por competência (mês/ano)
- [ ] PDF de implantação gerado conforme layout padrão
- [ ] PDF de alteração com Antes/Alterações/Depois
- [ ] PDF de folha de pagamento por competência
- [ ] Módulo de PDF isolado e desacoplado da lógica de negócio
- [ ] Relatório de alocação com filtros por projeto/fonte/perfil
- [ ] Dashboard consolidado por fonte de financiamento
- [ ] Evidências de testes documentadas
