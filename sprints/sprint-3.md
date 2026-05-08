# Sprint 3 - Monitoramento e Documentos

**Objetivo:** Emitir documentos PDF padronizados, solicitacao de pagamento e consultas/relatorios consolidados.

**Metricas:** 7 US | 31 Story Points | 56 horas estimadas

---

## Visao Geral das Fases

```
Fase 1: Pagamento por Competencia  [US-SD-06]                    ── base para PDF de pagamento
    |
Fase 2: Geracao de PDFs           [US-SD-07, US-SD-08, US-SD-09] ── depende dos dados das Sprints 1-2
    |
Fase 3: Monitoramento/Relatorios  [US-MO-01, US-MO-02]           ── depende dos vinculos cadastrados
    |
Fase 4: Evidencias                [US-AQ-04]                      ── pos-implementacao
```

---

## Fase 1 — Pagamento por Competencia

### US-SD-06 | Criar solicitacao de pagamento por competencia (5 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-05 - Solicitacao de pagamento de RH por mes/ano
**Prioridade:** Alta

**Descricao:** Como coordenador, quero solicitar pagamento de RH por mes e ano para gerar a documentacao da competencia.

**BDD:** DADO que exista equipe vigente, QUANDO o coordenador informar mes e ano, ENTAO o sistema deve listar membros ativos e valores da competencia.

**Criterios de Aceitacao:**
- CA-01: A solicitacao de pagamento deve exigir mes e ano de referencia
- CA-02: O sistema deve listar somente membros ativos na competencia
- CA-03: O pagamento deve considerar fonte e carga horaria vigente

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 1 | TK-US-SD-06-01 | back | Endpoint `POST /solicitacoes/` (tipo=Pagamento) com mes_ano, listar membros ativos no periodo, calcular valores por fonte | Vinicius | 3 | [ ] |
| 2 | TK-US-SD-06-02 | front | Tela de solicitacao de pagamento: selecao de mes/ano, listagem de membros ativos com valores | Lindomar | 3 | [ ] |
| 3 | TK-US-SD-06-03 | qa | Testar filtragem por competencia, membros fora do periodo, calculo de valores | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #1:**
- Filtrar `Pesquisador_Projeto` onde `data_inicio <= ultimo_dia_mes` e `data_fim >= primeiro_dia_mes`
- Agrupar por fonte_financiamento
- Calcular valor mensal com base na CH e Parametro_Regra vigente

---

## Fase 2 — Geracao de PDFs

> **Referencia:** docs/08-guia-implantacao-alteracao-rh.md (estrutura exata dos PDFs)

### US-SD-07 | Gerar PDF de implantacao inicial (5 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero gerar PDF de implantacao inicial para anexar ao processo administrativo.

**BDD:** DADO que a implantacao inicial esteja valida, QUANDO o usuario acionar a emissao, ENTAO o PDF deve ser gerado no padrao definido.

**Criterios de Aceitacao:**
- CA-01: O sistema deve gerar PDF de implantacao inicial conforme layout padrao

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 4 | TK-US-SD-07-01 | back | Modulo de geracao de PDF de implantacao: cabecalho, tabelas por fonte (EMPRESA/EMBRAPII/SEBRAE), totais, justificativa, assinatura | Marcelo | 3 | [ ] |
| 5 | TK-US-SD-07-02 | front | Botao "Gerar PDF" na tela de solicitacao, download do arquivo | Lucas | 3 | [ ] |
| 6 | TK-US-SD-07-03 | qa | Validar PDF gerado contra layout de referencia (docs/08), conferir valores e formatacao | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #4:**
- Estrutura do PDF conforme docs/08-guia-implantacao-alteracao-rh.md Secao 1:
  - Cabecalho: Projeto, Codigo, Solicitacao No., Data
  - Titulo: "SOLICITACAO DE RH: IMPLANTACAO DE RH"
  - Secao 1: tabelas por fonte (1.1 EMPRESA, 1.2 EMBRAPII, 1.3 SEBRAE)
  - Colunas: Nome, CPF (oculto em EMPRESA), Funcao/Categoria, CH Mensal, Bolsa mensal, Qtd. Meses, Inicio, Total
  - Secao 2: Justificativa
  - Bloco de assinatura do coordenador
- Formato monetario: R$ X.XXX,XX
- Datas: DD/MM/AAAA
- Modulo isolado da logica de negocio (conforme CLAUDE.md)

---

### US-SD-08 | Gerar PDF de alteracao de RH (5 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero gerar PDF de alteracao de RH com estado atual e proposto para formalizar mudancas.

**BDD:** DADO que exista alteracao de RH validada, QUANDO o usuario emitir o documento, ENTAO o PDF deve apresentar as informacoes antes e depois.

**Criterios de Aceitacao:**
- CA-01: O sistema deve gerar PDF de alteracao de RH
- CA-02: O sistema deve comparar equipe atual e equipe proposta
- CA-03: As diferencas devem ser exibidas de forma clara

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 7 | TK-US-SD-08-01 | back | Modulo de geracao de PDF de alteracao: Secao Atual (Antes), Secao Alteracoes Solicitadas, Secao Nova (Depois), justificativa | Vinicius | 3 | [ ] |
| 8 | TK-US-SD-08-02 | front | Botao "Gerar PDF de Alteracao" com preview e download | Lindomar | 3 | [ ] |
| 9 | TK-US-SD-08-03 | qa | Validar PDF com cenarios: balanceamento financeiro, inclusao, saida, troca de funcao | Carolina | 2 | [ ] |

**Detalhamento tecnico da Task #7:**
- Estrutura conforme docs/08, Secao 1.2:
  - Secao 1: RH Atual (Antes) — tabelas por fonte com historico completo
  - Secao 2: Alteracoes Solicitadas — tabela resumo (Bolsista, Perfil, CH, Valor Hora, Valor Bolsa, Alteracao)
  - Secao 3: RH a partir de [mes/ano] (Depois) — tabelas por fonte com nova composicao
  - Secao 4: Justificativa
- Reutilizar componentes do modulo de PDF de implantacao para tabelas por fonte
- Tipos de alteracao: balanceamento financeiro, reducao CH, inclusao, saida, troca funcao, migracao categoria, transferencia

---

### US-SD-09 | Gerar PDF de folha/solicitacao de pagamento (5 pts)

**Epic:** EP-02 Modulo Solicitacoes e Documentos
**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados
**Prioridade:** Alta

**Descricao:** Como coordenador, quero gerar PDF de folha de pagamento para a competencia selecionada.

**BDD:** DADO que a solicitacao de pagamento foi calculada, QUANDO o usuario emitir o documento, ENTAO o PDF deve listar membros, fonte, horas e valores.

**Criterios de Aceitacao:**
- CA-01: O sistema deve gerar PDF de folha/solicitacao de pagamento
- CA-02: A solicitacao de pagamento deve exigir mes e ano de referencia
- CA-03: O sistema deve listar somente membros ativos na competencia

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 10 | TK-US-SD-09-01 | back | Modulo de geracao de PDF de pagamento: membros ativos no mes/ano, valores por fonte, totais | Marcelo | 3 | [ ] |
| 11 | TK-US-SD-09-02 | front | Botao "Gerar PDF de Pagamento" na tela de solicitacao | Lucas | 3 | [ ] |
| 12 | TK-US-SD-09-03 | qa | Validar PDF de pagamento, conferir membros e valores da competencia | Carolina | 2 | [ ] |

---

## Fase 3 — Monitoramento e Relatorios

### US-MO-01 | Consultar alocacao por projeto, fonte e perfil (5 pts)

**Epic:** EP-05 Modulo Monitoramento
**Feature:** F-MO-01 - Consulta e relatorio de alocacao por projeto, fonte e perfil
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero consultar alocacao por projeto, fonte e perfil para acompanhar a composicao das equipes.

**BDD:** DADO que existam vinculos cadastrados, QUANDO aplicar filtros de projeto, fonte ou perfil, ENTAO o relatorio deve exibir os dados vigentes.

**Criterios de Aceitacao:**
- CA-01: O relatorio deve permitir filtrar por projeto, fonte e perfil
- CA-02: O relatorio deve permitir exportar/visualizar dados consolidados
- CA-03: Os dados devem refletir a versao vigente de RH

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 13 | TK-US-MO-01-01 | back | Endpoint `GET /monitoramento/alocacoes?projeto_id=&fonte=&perfil=` com filtros combinados e dados da versao vigente | Vinicius | 3 | [ ] |
| 14 | TK-US-MO-01-02 | front | Tela de relatorio com filtros de projeto/fonte/perfil, tabela de resultados | Lindomar | 3 | [ ] |
| 15 | TK-US-MO-01-03 | qa | Testar combinacoes de filtros, dados retornados vs versao vigente | Carolina | 2 | [ ] |

---

### US-MO-02 | Visualizar consolidacao por fonte (3 pts)

**Epic:** EP-05 Modulo Monitoramento
**Feature:** F-MO-02 - Visao consolidada por fonte de financiamento
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero visualizar a distribuicao por fonte de financiamento para acompanhar EMBRAPII, EMPRESA, SEBRAE e IFPB.

**BDD:** DADO que existam vinculos com fontes cadastradas, QUANDO abrir a visao consolidada, ENTAO o sistema deve apresentar totais separados por fonte.

**Criterios de Aceitacao:**
- CA-01: A visao deve separar fontes EMBRAPII, EMPRESA, SEBRAE e IFPB
- CA-02: O sistema deve apresentar totais por fonte (CH total, valor total, qtd pesquisadores)
- CA-03: A consulta deve considerar apenas vinculos ativos ou vigentes no filtro

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 16 | TK-US-MO-02-01 | back | Endpoint `GET /monitoramento/consolidado-fonte?projeto_id=` com somatorios por fonte | Marcelo | 3 | [ ] |
| 17 | TK-US-MO-02-02 | front | Dashboard consolidado por fonte com cards/graficos de totais | Lucas | 3 | [ ] |
| 18 | TK-US-MO-02-03 | qa | Testar totais por fonte, verificar vinculos inativos excluidos | Carolina | 2 | [ ] |

---

## Fase 4 — Evidencias

### US-AQ-04 | Registrar evidencias de testes da Sprint 3 (3 pts)

**Epic:** EP-08 Atividades Auxiliares e Qualidade
**Feature:** F-AQ-03 - Qualidade, evidencias e apoio ao OpenProject
**Prioridade:** Baixa

**Descricao:** Como QA, quero registrar evidencias de testes para comprovar a execucao das US da sprint.

**BDD:** DADO que as US estejam implementadas, QUANDO os testes forem realizados, ENTAO as evidencias devem ser organizadas para entrega.

**Criterios de Aceitacao:**
- CA-01: Cada US deve possuir evidencia de teste ou validacao
- CA-02: O PDF de evidencias deve comprovar criterios, BDD, tasks, horas e responsaveis

#### Tasks

| # | Task ID | Tipo | Descricao | Responsavel | Horas | Status |
|---|---------|------|-----------|-------------|-------|--------|
| 19 | TK-US-AQ-04-01 | devops/doc | Preparar artefatos tecnicos e evidencias | Vinicius | 3 | [ ] |
| 20 | TK-US-AQ-04-02 | doc | Documentar evidencias e configuracao | Erick | 3 | [ ] |
| 21 | TK-US-AQ-04-03 | qa | Validar evidencias e rastreabilidade | Carolina | 2 | [ ] |

---

## Resumo de Carga por Responsavel

| Responsavel | Funcao | Tasks | Horas |
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

- [ ] Solicitacao de pagamento por competencia (mes/ano)
- [ ] PDF de implantacao gerado conforme layout padrao
- [ ] PDF de alteracao com Antes/Alteracoes/Depois
- [ ] PDF de folha de pagamento por competencia
- [ ] Modulo de PDF isolado e desacoplado da logica de negocio
- [ ] Relatorio de alocacao com filtros por projeto/fonte/perfil
- [ ] Dashboard consolidado por fonte de financiamento
- [ ] Evidencias de testes documentadas
