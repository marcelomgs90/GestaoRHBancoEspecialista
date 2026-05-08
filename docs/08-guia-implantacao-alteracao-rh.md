# Guia de Implementacao - Modulo de Implantacao e Alteracao de RH

Este documento foi construido a partir da analise de 5 PDFs reais do projeto IntegradorOS (PIFP-2412.0041), servindo como referencia exata para a implementacao do sistema.

---

## 1. Estrutura dos Documentos PDF

### 1.1 PDF de Implantacao de RH

Estrutura sequencial do documento:

```
CABECALHO
  Projeto: [Nome do Projeto] - [Codigo]
  Solicitacao No.: [XX/AAAA]
  [Cidade], [data por extenso]

TITULO
  SOLICITACAO DE RH: IMPLANTACAO DE RH

DESTINATARIO
  A FUNETEC
  Senhor(a) Superintendente,

TEXTO PADRAO DE ABERTURA
  "Na condicao de coordenador do supracitado projeto..."

SECAO 1: Implantacao de Recursos Humanos do Projeto
  1.1 RH EMPRESA
    [Tabela de pesquisadores]
    Total: [valor]
  1.2 RH EMBRAPII
    [Tabela de pesquisadores]
    Total: [valor]
  1.3 RH SEBRAE
    [Tabela de pesquisadores]
    Total: [valor]

SECAO 2: JUSTIFICATIVA
  [Texto livre do coordenador]

BLOCO DE ASSINATURA
  ___________________________________________________
  [Nome do Coordenador] - Matricula
  Siape No. [numero]
  Coordenador do Projeto
```

### 1.2 PDF de Alteracao de RH

Estrutura sequencial do documento:

```
CABECALHO (identico ao de Implantacao)

TITULO
  SOLICITACAO DE RH: ALTERACAO DE RH

DESTINATARIO E TEXTO DE ABERTURA (identicos)

SECAO 1: Recursos Humanos do Projeto - Atual (ANTES)
  1.1 RH EMPRESA
    [Tabela com equipe ATUAL]
    Total: [valor]
  1.2 RH EMBRAPII
    [Tabela com equipe ATUAL]
    Total: [valor]
  1.3 RH SEBRAE
    [Tabela com equipe ATUAL]
    Total: [valor]

SECAO 2: ALTERACOES SOLICITADAS
  [Tabela resumo das alteracoes]

SECAO 3: Recursos Humanos do Projeto a partir de [mes/ano]
  3.1 RH EMPRESA
    [Tabela com equipe NOVA - DEPOIS]
    Total: [valor]
  3.2 RH EMBRAPII
    [Tabela com equipe NOVA - DEPOIS]
    Total: [valor]
  3.3 RH SEBRAE
    [Tabela com equipe NOVA - DEPOIS]
    Total: [valor]

SECAO 4: JUSTIFICATIVA
  [Texto livre do coordenador]

BLOCO DE ASSINATURA
```

---

## 2. Tabelas de Pesquisadores (Implantacao e Antes/Depois)

### 2.1 Colunas da Tabela

| Coluna | Descricao | Observacao |
|--------|-----------|------------|
| Nome | Nome completo do pesquisador | |
| CPF | CPF do pesquisador | Visivel apenas em fontes EMBRAPII e SEBRAE. Na fonte EMPRESA, o CPF e omitido |
| Funcao/Categoria | Categoria de bolsa do pesquisador | Ex: Coordenador, Pesquisador Master, Profissional Junior |
| CH Mensal | Carga horaria mensal em horas | Valores observados: 16, 20, 80, 160 |
| Bolsa mensal | Valor monetario da bolsa mensal | Formato R$ X.XXX,XX |
| Qtd. de Meses | Quantidade de meses de atuacao | Inteiro |
| Inicio | Periodo de atuacao | Formato "De DD/MM/AAAA a DD/MM/AAAA" |
| Total | Valor total (bolsa x meses) | Formato R$ X.XXX,XX |

### 2.2 Regra de Exibicao do CPF por Fonte

| Fonte | CPF Visivel |
|-------|-------------|
| EMPRESA | NAO |
| EMBRAPII | SIM |
| SEBRAE | SIM |

### 2.3 Multiplas Linhas por Pesquisador

Um mesmo pesquisador pode aparecer **multiplas vezes** na mesma tabela de uma fonte, representando periodos de atuacao distintos. Exemplo real observado:

```
Andre Fellipe Cavalcante Silva | Coordenador | 20  | 1 mes | 01/01/2025 a 31/01/2025
Andre Fellipe Cavalcante Silva | Coordenador | 16  | 1 mes | 01/02/2025 a 28/02/2025
Andre Fellipe Cavalcante Silva | Coordenador | 16  | 2 meses | 01/07/2025 a 30/08/2025
```

Isso indica que a CH mudou de 20 para 16 horas a partir de fevereiro, e houve uma pausa entre marco e junho.

### 2.4 Mesmo Pesquisador em Multiplas Fontes

O mesmo pesquisador pode aparecer em **fontes diferentes simultaneamente** no mesmo projeto. Exemplo:

```
EMPRESA:  Alissia Deolinda | Profissional Junior | 160h | 01/12/2025 a 30/12/2025
EMBRAPII: Alissia Deolinda | Profissional Junior | 160h | 01/06/2025 a 30/11/2025
SEBRAE:   Alissia Deolinda | Profissional Junior | 160h | 01/01/2025 a 30/05/2025
```

A fonte de financiamento muda ao longo do tempo (balanceamento financeiro).

---

## 3. Tabela de Alteracoes Solicitadas (Secao 2 do PDF de Alteracao)

### 3.1 Colunas

| Coluna | Descricao |
|--------|-----------|
| Bolsista | Nome do pesquisador afetado |
| Perfil | Categoria atual ou nova |
| CH | Carga horaria mensal |
| Valor da Hora | Valor por hora |
| Valor da Bolsa | Valor mensal da bolsa |
| Alteracao | Descricao textual da mudanca |

### 3.2 Tipos de Alteracao Observados nos Exemplos

| Tipo | Exemplo de Descricao | Impacto |
|------|----------------------|---------|
| **Balanceamento financeiro** | "Ajuste nas fontes de pagamentos para balanceamento financeiro" | Redistribuicao de periodos entre fontes EMPRESA/EMBRAPII/SEBRAE |
| **Reducao de CH** | "Reducao da CH para adequacao entre os projetos" | Mudanca no campo CH Mensal (ex: 20 -> 16) |
| **Inclusao de membro** | "Inclusao no projeto apos publicacao de resultado realizado por meio de entrevista" | Novo pesquisador aparece no DEPOIS |
| **Saida do projeto** | "Saida da coordenacao e do projeto a pedido" | Pesquisador desaparece ou tem periodos zerados no DEPOIS |
| **Troca de funcao/perfil** | "Alteracao de pesquisador para coordenadora do projeto" | Mudanca na coluna Funcao/Categoria |
| **Migracao de categoria** | "Alteracao de perfil de Estudante para Profissional de acordo com NOTA TECNICA POLO-IFPB No 01/2022" | Mudanca de categoria com possivel mudanca de CH (80 -> 160) |
| **Transferencia** | "Migracao para o projeto R6P (Enersys)" | Pesquisador sai deste projeto para outro |

---

## 4. Categorias de Bolsa Observadas

| Categoria | CH Mensal Tipica | Observacao |
|-----------|-----------------|------------|
| Coordenador | 16 ou 20 | Responsavel pelo projeto |
| Pesquisador Master | 20 | Pesquisador senior |
| Profissional Junior | 160 | Colaborador externo junior |
| Profissional Iniciante | 80 ou 160 | Colaborador externo iniciante |
| Estudante Nivel Superior Avancado | 80 | Estudante com perfil avancado |
| Estudante Nivel Superior Iniciante | 80 | Estudante com perfil iniciante |

**Nota:** A CH de 160 horas e usada para profissionais com dedicacao integral. A CH pode mudar ao longo do tempo conforme alteracoes de RH.

---

## 5. Fontes de Financiamento

As secoes do PDF sao sempre agrupadas por fonte, na ordem fixa:

1. **RH EMPRESA**
2. **RH EMBRAPII**
3. **RH SEBRAE**

**Nota:** A fonte **IFPB** nao apareceu nos exemplos analisados, mas esta prevista na especificacao do sistema.

---

## 6. Regras de Negocio Extraidas dos Exemplos

### 6.1 Versionamento Acumulativo

O PDF de alteracao mostra o historico **completo** do projeto, nao apenas as mudancas. A secao "Depois" contem TODOS os registros desde o inicio do projeto, incluindo periodos passados que ja foram pagos. Isso significa que:

- O sistema deve manter todo o historico de alocacao
- Ao gerar o PDF "Depois", deve incluir registros desde a data de inicio do projeto
- Registros passados nao sao removidos, apenas periodos futuros sao ajustados

### 6.2 Periodos com Lacunas

Pesquisadores podem ter **lacunas** entre periodos de atuacao. Exemplo:
- Periodo 1: 01/02/2025 a 28/02/2025
- (lacuna marco a junho)
- Periodo 2: 01/07/2025 a 30/08/2025

Isso e comum quando ha balanceamento entre fontes ou pausa temporaria.

### 6.3 Migracao de Categoria (Nota Tecnica 01/2022)

Quando um estudante conclui o curso, ele pode ser reclassificado como Profissional (colaborador externo) sem necessidade de novo cadastramento no Banco de Especialistas. Regra da NOTA TECNICA POLO-IFPB No 01/2022:

> "No caso de um estudante participante de equipe de projeto encerrar seu vinculo academico com a ICT de origem quando da conclusao do curso, antes da data de termino no projeto, este podera ser enquadrado em nova categoria, por exemplo, como colaborador externo."

**Impacto no sistema:** a categoria e a CH do pesquisador podem mudar a partir de uma data especifica (ex: Estudante Nivel Superior Avancado 80h -> Profissional Iniciante 160h).

### 6.4 Realocacao sem Nova Entrevista (Nota Tecnica 01/2022)

> "Caso um projeto tenha sido finalizado, um CP podera solicitar a realocacao da equipe total ou parcial para um novo projeto, desde que ocorra ate 60 dias apos termino de vigencia da bolsa em curso."

**Impacto no sistema:** validar se a realocacao ocorre dentro de 60 dias do fim do projeto anterior.

### 6.5 Inclusao via Processo Seletivo

Novos membros podem ser incluidos apos publicacao de resultado de selecao. A justificativa deve conter o link da publicacao do processo seletivo.

### 6.6 Transferencia de Coordenador

A funcao de Coordenador pode ser transferida para outro pesquisador do projeto:
- O coordenador anterior pode sair completamente ou permanecer como pesquisador
- O novo coordenador muda de "Pesquisador Master" para "Coordenadora" (exemplo: Juliana assumiu no lugar de Andre)
- A mudanca se reflete em TODAS as fontes simultaneamente

### 6.7 Transferencia entre Projetos

Quando um pesquisador migra para outro projeto:
- Na secao "Depois", seus periodos futuros aparecem com Qtd. de Meses = 0
- A justificativa indica o projeto destino
- O projeto destino deve criar sua propria solicitacao de alteracao para incluir o pesquisador

---

## 7. Calculos Financeiros

### 7.1 Valores de Bolsa Observados

| Categoria | Valor Mensal Observado |
|-----------|----------------------|
| Pesquisador Master (20h) | R$ 4.585,00 |
| Profissional Junior (160h) | R$ 5.484,80 |
| Profissional Iniciante (80h) | R$ 2.056,80 |
| Profissional Iniciante (160h) | R$ 4.113,60 |
| Estudante Nivel Superior Avancado (80h) | R$ 1.250,40 |
| Estudante Nivel Superior Iniciante (80h) | R$ 1.000,00 |

### 7.2 Formula de Calculo

```
Total por linha = Bolsa mensal x Qtd. de Meses
Total por fonte = Somatorio de todos os Totais das linhas daquela fonte
```

### 7.3 Proporcionalidade

O valor da bolsa e proporcional a CH. Exemplo com Profissional Iniciante:
- 80h/mes = R$ 2.056,80
- 160h/mes = R$ 4.113,60 (exatamente o dobro)

---

## 8. Bloco de Assinatura

```
Atenciosamente,


___________________________________________________
[Nome Completo] - Matricula
Siape No. [Numero]
Coordenador(a) do Projeto
```

**Nota:** Quando ha troca de coordenador, o documento pode ser assinado pelo novo ou pelo antigo coordenador, dependendo de quem submete a solicitacao. No exemplo da solicitacao 08_2025, Andre (coordenador que esta saindo) assina a solicitacao de sua propria saida.

---

## 9. Sequencia de Solicitacoes (Fluxo Evolutivo)

Os exemplos analisados mostram a evolucao real de um unico projeto:

| Solicitacao | Tipo | Descricao |
|-------------|------|-----------|
| 03/2025 | Implantacao | Equipe inicial com 8 pesquisadores distribuidos em EMPRESA, EMBRAPII e SEBRAE |
| 05/2025 | Alteracao | Balanceamento financeiro entre fontes, reducao de CH do coordenador (20->16), inclusao de Danillo via processo seletivo |
| 08/2025 (=13/2025) | Alteracao | Saida do coordenador Andre, Juliana assume como coordenadora, migracao de Matheus de Estudante para Profissional, inclusao de Bruno, Haniel e Laila |
| 14/2025 | Alteracao | Transferencia de Alic para o projeto R6P (Enersys). Juliana agora assina como coordenadora |

**Observacao:** cada alteracao toma como "Atual" o resultado da alteracao anterior. O sistema deve manter esse encadeamento de versoes.

---

## 10. Requisitos para Geracao de PDF

### 10.1 Layout

- Tabelas com bordas
- Cabecalho institucional
- Formatacao de moeda brasileira (R$ X.XXX,XX)
- Datas no formato DD/MM/AAAA
- Quebra de pagina quando a tabela excede a pagina
- Ordem fixa das fontes: EMPRESA, EMBRAPII, SEBRAE (, IFPB)

### 10.2 Dados Necessarios para Gerar o PDF

**Implantacao:**
- Dados do projeto (nome, codigo)
- Numero da solicitacao
- Data de emissao
- Lista completa de pesquisadores com: nome, CPF, categoria, CH, valor da bolsa, qtd meses, periodo, total - agrupados por fonte
- Texto de justificativa
- Dados do coordenador para assinatura (nome, matricula, Siape)

**Alteracao:**
- Tudo acima, MAIS:
- Versao ATUAL (antes) da equipe completa, agrupada por fonte
- Tabela resumo de alteracoes (bolsista, perfil, CH, valor hora, valor bolsa, descricao da alteracao)
- Versao NOVA (depois) da equipe completa, agrupada por fonte
- Mes/ano a partir do qual as alteracoes entram em vigor
