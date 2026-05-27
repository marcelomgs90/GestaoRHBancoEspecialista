# Guia de Implementação - Módulo de Implantação e Alteração de RH

Este documento foi construído a partir da análise de 5 PDFs reais do projeto IntegradorOS (PIFP-2412.0041), servindo como referência exata para a implementação do sistema.

---

## 1. Estrutura dos Documentos PDF

### 1.1 PDF de Implantação de RH

Estrutura sequencial do documento:

```
CABECALHO
  Projeto: [Nome do Projeto] - [Código]
  Solicitação No.: [XX/AAAA]
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

### 1.2 PDF de Alteração de RH

Estrutura sequencial do documento:

```
CABECALHO (idêntico ao de Implantação)

TITULO
  SOLICITACAO DE RH: ALTERACAO DE RH

DESTINATARIO E TEXTO DE ABERTURA (idênticos)

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
  [Tabela resumo das alterações]

SECAO 3: Recursos Humanos do Projeto a partir de [mês/ano]
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

## 2. Tabelas de Pesquisadores (Implantação e Antes/Depois)

### 2.1 Colunas da Tabela

| Coluna | Descrição | Observação |
|--------|-----------|------------|
| Nome | Nome completo do pesquisador | |
| CPF | CPF do pesquisador | Visível apenas em fontes EMBRAPII e SEBRAE. Na fonte EMPRESA, o CPF é omitido |
| Função/Categoria | Categoria de bolsa do pesquisador | Ex: Coordenador, Pesquisador Master, Profissional Júnior |
| CH Mensal | Carga horária mensal em horas | Valores observados: 16, 20, 80, 160 |
| Bolsa mensal | Valor monetário da bolsa mensal | Formato R$ X.XXX,XX |
| Qtd. de Meses | Quantidade de meses de atuação | Inteiro |
| Início | Período de atuação | Formato "De DD/MM/AAAA a DD/MM/AAAA" |
| Total | Valor total (bolsa x meses) | Formato R$ X.XXX,XX |

### 2.2 Regra de Exibição do CPF por Fonte

| Fonte | CPF Visível |
|-------|-------------|
| EMPRESA | NÃO |
| EMBRAPII | SIM |
| SEBRAE | SIM |

### 2.3 Múltiplas Linhas por Pesquisador

Um mesmo pesquisador pode aparecer **múltiplas vezes** na mesma tabela de uma fonte, representando períodos de atuação distintos. Exemplo real observado:

```
Andre Fellipe Cavalcante Silva | Coordenador | 20  | 1 mes | 01/01/2025 a 31/01/2025
Andre Fellipe Cavalcante Silva | Coordenador | 16  | 1 mes | 01/02/2025 a 28/02/2025
Andre Fellipe Cavalcante Silva | Coordenador | 16  | 2 meses | 01/07/2025 a 30/08/2025
```

Isso indica que a CH mudou de 20 para 16 horas a partir de fevereiro, e houve uma pausa entre marco e junho.

### 2.4 Mesmo Pesquisador em Múltiplas Fontes

O mesmo pesquisador pode aparecer em **fontes diferentes simultaneamente** no mesmo projeto. Exemplo:

```
EMPRESA:  Alissia Deolinda | Profissional Junior | 160h | 01/12/2025 a 30/12/2025
EMBRAPII: Alissia Deolinda | Profissional Junior | 160h | 01/06/2025 a 30/11/2025
SEBRAE:   Alissia Deolinda | Profissional Junior | 160h | 01/01/2025 a 30/05/2025
```

A fonte de financiamento muda ao longo do tempo (balanceamento financeiro).

---

## 3. Tabela de Alterações Solicitadas (Seção 2 do PDF de Alteração)

### 3.1 Colunas

| Coluna | Descrição |
|--------|-----------|
| Bolsista | Nome do pesquisador afetado |
| Perfil | Categoria atual ou nova |
| CH | Carga horária mensal |
| Valor da Hora | Valor por hora |
| Valor da Bolsa | Valor mensal da bolsa |
| Alteração | Descrição textual da mudança |

### 3.2 Tipos de Alteração Observados nos Exemplos

| Tipo | Exemplo de Descrição | Impacto |
|------|----------------------|---------|
| **Balanceamento financeiro** | "Ajuste nas fontes de pagamentos para balanceamento financeiro" | Redistribuição de períodos entre fontes EMPRESA/EMBRAPII/SEBRAE |
| **Redução de CH** | "Redução da CH para adequação entre os projetos" | Mudança no campo CH Mensal (ex: 20 -> 16) |
| **Inclusão de membro** | "Inclusão no projeto após publicação de resultado realizado por meio de entrevista" | Novo pesquisador aparece no DEPOIS |
| **Saída do projeto** | "Saída da coordenação e do projeto a pedido" | Pesquisador desaparece ou tem períodos zerados no DEPOIS |
| **Troca de função/perfil** | "Alteração de pesquisador para coordenadora do projeto" | Mudança na coluna Função/Categoria |
| **Migração de categoria** | "Alteração de perfil de Estudante para Profissional de acordo com NOTA TECNICA POLO-IFPB No 01/2022" | Mudança de categoria com possível mudança de CH (80 -> 160) |
| **Transferência** | "Migração para o projeto R6P (Enersys)" | Pesquisador sai deste projeto para outro |

---

## 4. Categorias de Bolsa Observadas

| Categoria | CH Mensal Típica | Observação |
|-----------|-----------------|------------|
| Coordenador | 16 ou 20 | Responsável pelo projeto |
| Pesquisador Master | 20 | Pesquisador sênior |
| Profissional Júnior | 160 | Colaborador externo júnior |
| Profissional Iniciante | 80 ou 160 | Colaborador externo iniciante |
| Estudante Nível Superior Avançado | 80 | Estudante com perfil avançado |
| Estudante Nível Superior Iniciante | 80 | Estudante com perfil iniciante |

**Nota:** A CH de 160 horas é usada para profissionais com dedicação integral. A CH pode mudar ao longo do tempo conforme alterações de RH.

---

## 5. Fontes de Financiamento

As seções do PDF são sempre agrupadas por fonte, na ordem fixa:

1. **RH EMPRESA**
2. **RH EMBRAPII**
3. **RH SEBRAE**

**Nota:** A fonte **IFPB** não apareceu nos exemplos analisados, mas está prevista na especificação do sistema.

---

## 6. Regras de Negocio Extraidas dos Exemplos

### 6.1 Versionamento Acumulativo

O PDF de alteração mostra o histórico **completo** do projeto, não apenas as mudanças. A seção "Depois" contém TODOS os registros desde o início do projeto, incluindo períodos passados que já foram pagos. Isso significa que:

- O sistema deve manter todo o histórico de alocação
- Ao gerar o PDF "Depois", deve incluir registros desde a data de início do projeto
- Registros passados não são removidos, apenas períodos futuros são ajustados

### 6.2 Períodos com Lacunas

Pesquisadores podem ter **lacunas** entre períodos de atuação. Exemplo:
- Período 1: 01/02/2025 a 28/02/2025
- (lacuna março a junho)
- Período 2: 01/07/2025 a 30/08/2025

Isso é comum quando há balanceamento entre fontes ou pausa temporária.

### 6.3 Migração de Categoria (Nota Técnica 01/2022)

Quando um estudante conclui o curso, ele pode ser reclassificado como Profissional (colaborador externo) sem necessidade de novo cadastramento no Banco de Especialistas. Regra da NOTA TÉCNICA POLO-IFPB No 01/2022:

> "No caso de um estudante participante de equipe de projeto encerrar seu vínculo acadêmico com a ICT de origem quando da conclusão do curso, antes da data de término no projeto, este poderá ser enquadrado em nova categoria, por exemplo, como colaborador externo."

**Impacto no sistema:** a categoria e a CH do pesquisador podem mudar a partir de uma data específica (ex: Estudante Nível Superior Avançado 80h -> Profissional Iniciante 160h).

### 6.4 Realocação sem Nova Entrevista (Nota Técnica 01/2022)

> "Caso um projeto tenha sido finalizado, um CP poderá solicitar a realocação da equipe total ou parcial para um novo projeto, desde que ocorra até 60 dias após término de vigência da bolsa em curso."

**Impacto no sistema:** validar se a realocação ocorre dentro de 60 dias do fim do projeto anterior.

### 6.5 Inclusão via Processo Seletivo

Novos membros podem ser incluídos após publicação de resultado de seleção. A justificativa deve conter o link da publicação do processo seletivo.

### 6.6 Transferência de Coordenador

A função de Coordenador pode ser transferida para outro pesquisador do projeto:
- O coordenador anterior pode sair completamente ou permanecer como pesquisador
- O novo coordenador muda de "Pesquisador Master" para "Coordenadora" (exemplo: Juliana assumiu no lugar de André)
- A mudança se reflete em TODAS as fontes simultaneamente

### 6.7 Transferência entre Projetos

Quando um pesquisador migra para outro projeto:
- Na seção "Depois", seus períodos futuros aparecem com Qtd. de Meses = 0
- A justificativa indica o projeto destino
- O projeto destino deve criar sua própria solicitação de alteração para incluir o pesquisador

---

## 7. Cálculos Financeiros

### 7.1 Valores de Bolsa Observados

| Categoria | Valor Mensal Observado |
|-----------|----------------------|
| Pesquisador Master (20h) | R$ 4.585,00 |
| Profissional Júnior (160h) | R$ 5.484,80 |
| Profissional Iniciante (80h) | R$ 2.056,80 |
| Profissional Iniciante (160h) | R$ 4.113,60 |
| Estudante Nível Superior Avançado (80h) | R$ 1.250,40 |
| Estudante Nível Superior Iniciante (80h) | R$ 1.000,00 |

### 7.2 Fórmula de Cálculo

```
Total por linha = Bolsa mensal x Qtd. de Meses
Total por fonte = Somatorio de todos os Totais das linhas daquela fonte
```

### 7.3 Proporcionalidade

O valor da bolsa é proporcional à CH. Exemplo com Profissional Iniciante:
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

**Nota:** Quando há troca de coordenador, o documento pode ser assinado pelo novo ou pelo antigo coordenador, dependendo de quem submete a solicitação. No exemplo da solicitação 08_2025, André (coordenador que está saindo) assina a solicitação de sua própria saída.

---

## 9. Sequência de Solicitações (Fluxo Evolutivo)

Os exemplos analisados mostram a evolução real de um único projeto:

| Solicitação | Tipo | Descrição |
|-------------|------|-----------|
| 03/2025 | Implantação | Equipe inicial com 8 pesquisadores distribuídos em EMPRESA, EMBRAPII e SEBRAE |
| 05/2025 | Alteração | Balanceamento financeiro entre fontes, redução de CH do coordenador (20->16), inclusão de Danillo via processo seletivo |
| 08/2025 (=13/2025) | Alteração | Saída do coordenador André, Juliana assume como coordenadora, migração de Matheus de Estudante para Profissional, inclusão de Bruno, Haniel e Laila |
| 14/2025 | Alteração | Transferência de Alic para o projeto R6P (Enersys). Juliana agora assina como coordenadora |

**Observação:** cada alteração toma como "Atual" o resultado da alteração anterior. O sistema deve manter esse encadeamento de versões.

---

## 10. Requisitos para Geração de PDF

### 10.1 Layout

- Tabelas com bordas
- Cabeçalho institucional
- Formatação de moeda brasileira (R$ X.XXX,XX)
- Datas no formato DD/MM/AAAA
- Quebra de página quando a tabela excede a página
- Ordem fixa das fontes: EMPRESA, EMBRAPII, SEBRAE (, IFPB)

### 10.2 Dados Necessários para Gerar o PDF

**Implantação:**
- Dados do projeto (nome, código)
- Número da solicitação
- Data de emissão
- Lista completa de pesquisadores com: nome, CPF, categoria, CH, valor da bolsa, qtd meses, período, total - agrupados por fonte
- Texto de justificativa
- Dados do coordenador para assinatura (nome, matrícula, Siape)

**Alteração:**
- Tudo acima, MAIS:
- Versão ATUAL (antes) da equipe completa, agrupada por fonte
- Tabela resumo de alterações (bolsista, perfil, CH, valor hora, valor bolsa, descrição da alteração)
- Versão NOVA (depois) da equipe completa, agrupada por fonte
- Mês/ano a partir do qual as alterações entram em vigor
