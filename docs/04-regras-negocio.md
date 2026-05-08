# Regras de Negocio

## 1. Resolucao 11/2022 - Motor de Regras

O sistema deve codificar as regras da Resolucao 11/2022 do IFPB para impedir falhas humanas de alocacao que gerariam reprovacao em auditorias.

### 1.1 Categorias e Valores de Bolsa

- Cada categoria de bolsa possui valor, unidade de referencia, limites semanal/mensal e percentual aplicavel
- Os valores sao parametrizaveis pelo Administrador
- **Vigencia Historica**: alteracoes em valores NAO sao retroativas. Cada valor tem data de inicio e fim de vigencia, garantindo que recalculos nao corrompam historico financeiro de projetos passados

### 1.2 Limite de Carga Horaria Global

- Existe um limite global de carga horaria que se aplica a todos os pesquisadores
- O limite e verificado na consulta ao Banco de Especialistas
- A validacao considera TODAS as alocacoes do pesquisador em TODOS os projetos (nao apenas o projeto corrente)

### 1.3 Calculo Automatico de Bolsas

- Valores de bolsas sao calculados automaticamente com base em:
  - Categoria do pesquisador
  - Carga horaria semanal alocada
  - Tabela de valores vigente na data da alocacao
  - Fonte de financiamento
- O calculo e proporcional a carga horaria

---

## 2. Fontes de Financiamento

O sistema deve controlar a alocacao de pesquisadores por 4 fontes de financiamento:

| Fonte | Sigla |
|-------|-------|
| EMBRAPII | EMBRAPII |
| EMPRESA | EMPRESA |
| SEBRAE | SEBRAE |
| IFPB | IFPB |

- Cada pesquisador em um projeto deve estar vinculado a exatamente uma fonte
- O sistema deve fornecer visao consolidada por fonte (somatorio de CH, somatorio financeiro, percentual)

---

## 3. Fluxo de Solicitacoes de RH

### 3.1 Implantacao Inicial

1. Coordenador cria solicitacao de implantacao para seu projeto
2. Inclui pesquisadores com: fonte, carga horaria, categoria de bolsa
3. Sistema calcula automaticamente valores de bolsa
4. Sistema valida limites de carga horaria
5. Gera versao de RH (composicao da equipe)
6. Emite PDF de implantacao

### 3.2 Alteracao de RH

1. Coordenador cria solicitacao de alteracao
2. Sistema registra estado "ANTES" (versao atual da equipe)
3. Coordenador faz alteracoes: inclusao, alteracao ou encerramento de participacao
4. Sistema registra estado "DEPOIS" (versao proposta)
5. Sistema calcula diferencas (CH, valores)
6. Emite PDF com comparativo Antes / Alteracoes Solicitadas / Depois

### 3.3 Pagamento de RH

1. Coordenador cria solicitacao para mes/ano especifico
2. Sistema lista pesquisadores ativos no periodo
3. Sistema calcula valores devidos
4. Emite PDF de solicitacao de folha de pagamento

---

## 4. Fluxo de Transferencia entre Projetos

1. Coordenador do projeto destino solicita transferencia de pesquisador
2. Informa: pesquisador, projeto de origem, justificativa, carga horaria
3. Sistema notifica coordenador do projeto de origem (cedente)
4. Coordenador cedente avalia e emite parecer: **Aceitar** ou **Recusar**
5. Se aceito: transferencia e efetivada e registrada no historico
6. Se recusado: registra motivo da recusa

**Regra critica:** transferencia so e efetivada com aceite digital do coordenador cedente.

---

## 5. Versionamento de RH

- Cada solicitacao de implantacao ou alteracao gera uma nova versao de composicao de RH
- Versoes sao tipadas: "Antes" e "Depois"
- O historico completo de versoes e mantido
- O mesmo pesquisador pode atuar mais de uma vez no mesmo projeto em periodos distintos
- O sistema permite comparar versoes lado a lado

---

## 6. Geracao de Documentos PDF

### 6.1 PDF de Implantacao Inicial

- Cabecalho institucional
- Numero da solicitacao
- Titulo do projeto e coordenador
- Grid de pesquisadores (nome, funcao, fonte, CH, valor)
- Somatorio de carga horaria
- Somatorio financeiro
- Data de emissao

### 6.2 PDF de Alteracao de RH

- Cabecalho institucional
- Numero da solicitacao
- Secao "Situacao ANTES": equipe na versao anterior
- Secao "Alteracoes Solicitadas": o que muda
- Secao "Situacao DEPOIS": equipe na versao proposta
- Justificativa
- Diferenca de CH e valor
- Historico de alteracoes
- Data de emissao

### 6.3 PDF de Folha de Pagamento

- Projeto e mes/ano de referencia
- Numero da solicitacao
- Lista de pesquisadores com fonte, CH e valor individual
- Total da folha

---

## 7. Controle de Acesso por Perfil

| Funcionalidade | Admin | Coordenador | Gestor Polo | Apoio Coord. |
|----------------|-------|-------------|-------------|--------------|
| Gestao de usuarios/perfis | X | | | |
| Parametrizacao (CH, bolsas, tipos) | X | | | |
| Gestao de projetos | X | X (seus projetos) | X (consulta) | X (apoio) |
| Solicitacoes de RH | X | X (seus projetos) | X (consulta) | X (apoio) |
| Transferencias | X | X (como cedente ou destino) | X (consulta) | |
| Monitoramento multi-projeto | X | | X | |
| Emissao de PDFs | X | X (seus projetos) | X | X (apoio) |

---

## 8. Nota Tecnica 03/2020

O sistema tambem deve respeitar as diretrizes da Nota Tecnica 03/2020 no que se refere a limites e regras de alocacao de pesquisadores.

---

## 9. Premissas

- As diretrizes da Resolucao 11/2022 permanecerao em vigor durante o desenvolvimento
- Os modelos de oficios em PDF exigidos pelo Polo permaneceram os mesmos
- O Product Owner tera disponibilidade semanal para duvidas e homologacao
