# Regras de Negocio

## 1. Resolucao 11/2022 - Motor de Regras

O sistema deve codificar as regras da Resolucao 11/2022 do IFPB para impedir falhas humanas de alocacao que gerariam reprovacao em auditorias.

### 1.1 Categorias e Valores de Bolsa

- Cada categoria de bolsa possui valor, unidade de referencia, limites semanal/mensal e percentual aplicavel
- Os valores sao parametrizaveis pelo Administrador
- **Vigencia Historica**: alteracoes em valores NAO sao retroativas. Cada valor tem data de inicio e fim de vigencia, garantindo que recalculos nao corrompam historico financeiro de projetos passados

### 1.2 Limite de Carga Horaria Global

- Existe um limite global de carga horaria que se aplica a todos os pesquisadores
- A validacao considera as alocacoes do pesquisador em todos os projetos com versao `VIGENTE` (somatorio inter-projetos)
- **Versoes `PROPOSTA` (rascunhos) sao ignoradas** na soma — apenas a versao oficial conta
- Ao validar uma alteracao no projeto X, as alocacoes do proprio projeto X em `VIGENTE` sao excluidas da contagem, pois serao substituidas pela nova proposta apos submissao (`projeto_id_excluir`)
- Um mesmo `ref_pesquisador` nao pode ser incluido mais de uma vez na mesma versao de RH (validado em `MembroService.incluir`)

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

Disponivel apenas se o projeto **nao** possui versao `VIGENTE`.

1. Coordenador abre a tela de implantacao e adiciona pesquisadores localmente (rascunho em memoria)
2. Ao clicar em **Finalizar**, o sistema:
   - Cria a `Solicitacao_RH` (tipo `IMPLANTACAO`, status `EM_EDICAO`) e a `Versao_RH_Projeto` (n=1, status `PROPOSTA`)
   - Persiste os membros: calcula valor de bolsa via `Parametro_Regra` vigente e valida CH global
   - Chama o submeter: solicitacao passa a `SUBMETIDA` e versao passa a `VIGENTE`
3. Sistema emite PDF de implantacao a partir da versao `VIGENTE`

> **Idempotencia:** se ja existe uma `IMPLANTACAO` em `EM_EDICAO` para o projeto, o sistema reutiliza essa solicitacao em vez de criar duplicata.

### 3.2 Alteracao de RH

Disponivel apenas se o projeto **possui** versao `VIGENTE`. No maximo uma `ALTERACAO` em `EM_EDICAO` pode existir por projeto a qualquer momento.

1. Coordenador abre a tela de alteracao; o sistema carrega a versao `VIGENTE` como preview da equipe atual (sem persistir)
2. Coordenador faz mudancas: inclusao, alteracao de campos ou encerramento de participacao
3. Ao clicar em **Salvar Rascunho** ou **Submeter Solicitacao**, o sistema:
   - Cria a `Solicitacao_RH` (tipo `ALTERACAO`, status `EM_EDICAO`) e a nova `Versao_RH_Projeto` (n=anterior+1, status `PROPOSTA`)
   - Clona automaticamente a equipe da versao `VIGENTE` para a `PROPOSTA` como base editavel
   - Aplica inclusoes, alteracoes e encerramentos sobre a `PROPOSTA`
4. **Salvar Rascunho** mantem `EM_EDICAO`/`PROPOSTA`. **Submeter Solicitacao** promove para `SUBMETIDA`/`VIGENTE` e demove a `VIGENTE` anterior para `HISTORICO`
5. Sistema disponibiliza endpoint `GET /solicitacoes/{id}/comparacao` para comparativo Antes vs. Depois com diferencas (inclusoes, alteracoes campo a campo, encerramentos)
6. Sistema emite PDF com comparativo Antes / Alteracoes Solicitadas / Depois

> **Idempotencia:** se ja existe uma `ALTERACAO` em `EM_EDICAO` para o projeto, o sistema reutiliza essa solicitacao em vez de criar duplicata.

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

### 5.1 Ciclo de Vida das Versoes

Cada solicitacao de implantacao ou alteracao gera exatamente uma `Versao_RH_Projeto`. As versoes seguem o ciclo:

```
PROPOSTA  --(submeter)-->  VIGENTE  --(nova alteracao submetida)-->  HISTORICO
```

Invariantes:

- Cada projeto tem no maximo **uma** versao `VIGENTE` a qualquer momento
- Cada projeto tem no maximo **uma** versao `PROPOSTA` ativa a qualquer momento (associada a solicitacao `EM_EDICAO` em aberto)
- Versoes `HISTORICO` sao imutaveis e usadas para auditoria

### 5.2 Comparacao Antes vs. Depois

A comparacao Antes/Depois e feita entre a `PROPOSTA` da solicitacao e a versao com `numero_versao - 1` do mesmo projeto:

- Em `IMPLANTACAO`: nao existe versao anterior; o Antes e vazio e todos os membros aparecem como `inclusoes`
- Em `ALTERACAO`: o Antes e a versao anterior (a ultima `VIGENTE` antes da submissao, ou ainda `VIGENTE` se a solicitacao nao foi submetida)
- Diferencas calculadas: `inclusoes` (refs presentes so no Depois), `encerramentos` (refs presentes so no Antes), `alteracoes` (refs comuns com mudanca em categoria, fonte ou carga horaria)

### 5.3 Pesquisador em Multiplos Periodos

O mesmo pesquisador pode atuar mais de uma vez no mesmo projeto em periodos distintos (registros diferentes em `Pesquisador_Projeto` ligados a versoes diferentes). Dentro de uma mesma versao, porem, um `ref_pesquisador` so pode aparecer uma vez.

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
