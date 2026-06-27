# Regras de Negócio

## 1. Resolução 11/2022 - Motor de Regras

O sistema deve codificar as regras da Resolução 11/2022 do IFPB para impedir falhas humanas de alocação que gerariam reprovação em auditorias.

### 1.1 Categorias e Valores de Bolsa

- Cada categoria de bolsa possui valor, unidade de referência, limites semanal/mensal e percentual aplicável
- Os valores são parametrizáveis pelo Administrador
- **Vigência Histórica**: alterações em valores NÃO são retroativas. Cada valor tem data de início e fim de vigência, garantindo que recálculos não corrompam histórico financeiro de projetos passados

### 1.2 Limite de Carga Horária Global

- Existe um limite global de carga horária que se aplica a todos os pesquisadores
- A validação considera as alocações do pesquisador em todos os projetos com versão `VIGENTE` (somatório inter-projetos)
- **Versões `PROPOSTA` (rascunhos) são ignoradas** na soma — apenas a versão oficial conta
- Ao validar uma alteração no projeto X, as alocações do próprio projeto X em `VIGENTE` são excluídas da contagem, pois serão substituídas pela nova proposta após submissão (`projeto_id_excluir`)
- Um mesmo `ref_pesquisador` não pode ser incluído mais de uma vez na mesma versão de RH (validado em `MembroService.incluir`)

### 1.3 Cálculo Automático de Bolsas

- Valores de bolsas são calculados automaticamente com base em:
  - Categoria do pesquisador
  - Carga horária semanal alocada
  - Tabela de valores vigente na data da alocação
  - Fonte de financiamento
- O cálculo é proporcional à carga horária

---

## 2. Fontes de Financiamento

O sistema deve controlar a alocação de pesquisadores por 3 fontes de financiamento:

| Fonte | Sigla |
|-------|-------|
| EMBRAPII | EMBRAPII |
| EMPRESA | EMPRESA |
| SEBRAE | SEBRAE |

- Cada pesquisador em um projeto deve estar vinculado a exatamente uma fonte
- O sistema deve fornecer visão consolidada por fonte (somatório de CH, somatório financeiro, percentual)

---

## 3. Cadastro e Identificação de Projetos

- Todo projeto deve possuir uma sigla obrigatória, alfanumérica, com mínimo de 5 e máximo de 20 caracteres
- A sigla é usada como identificação principal nas telas de listagem, detalhamento e edição
- O código do projeto é opcional e deve ser informado manualmente pelo usuário quando existir
- O sistema não gera código de projeto automaticamente
- Quando o código for informado, o sistema deve validar unicidade e impedir duplicidade entre projetos
- Na grade de informações do detalhamento, o código só deve ser exibido quando estiver cadastrado

---

## 4. Fluxo de Solicitações de RH

### 4.1 Implantação Inicial

Disponível apenas se o projeto **não** possui versão `VIGENTE`.

1. Coordenador abre a tela de implantação e adiciona pesquisadores localmente (rascunho em memória)
2. Ao clicar em **Finalizar**, o sistema:
   - Cria a `Solicitacao_RH` (tipo `IMPLANTACAO`, status `EM_EDICAO`) e a `Versao_RH_Projeto` (n=1, status `PROPOSTA`)
   - Persiste os membros: calcula valor de bolsa via `Parametro_Regra` vigente e valida CH global
   - Chama o submeter: solicitação passa a `SUBMETIDA` (a versão permanece `PROPOSTA` até a aprovação)
3. Quando o Gestor do Polo **aprova**:
   - Solicitação passa a `APROVADA` e a versão `PROPOSTA` passa a `VIGENTE`
   - Equipe oficial do projeto passa a refletir os membros implantados
4. Sistema emite PDF de implantação a partir da versão `VIGENTE`

> **Idempotência:** se já existe uma `IMPLANTACAO` em `EM_EDICAO` para o projeto, o sistema reutiliza essa solicitação em vez de criar duplicata.

### 4.2 Alteração de RH

Disponível apenas se o projeto **possui** versão `VIGENTE`. No máximo uma `ALTERACAO` em `EM_EDICAO` pode existir por projeto a qualquer momento.

1. Coordenador abre a tela de alteração; o sistema carrega a versão `VIGENTE` como preview da equipe atual (sem persistir)
2. Coordenador faz mudanças: inclusão, alteração de campos ou encerramento de participação
3. Ao clicar em **Salvar Rascunho** ou **Submeter Solicitação**, o sistema:
   - Cria a `Solicitacao_RH` (tipo `ALTERACAO`, status `EM_EDICAO`) e a nova `Versao_RH_Projeto` (n=anterior+1, status `PROPOSTA`)
   - Clona automaticamente a equipe da versão `VIGENTE` para a `PROPOSTA` como base editável
   - Aplica inclusões, alterações e encerramentos sobre a `PROPOSTA`
4. **Salvar Rascunho** mantém `EM_EDICAO`/`PROPOSTA`. **Submeter Solicitação** move apenas a solicitação para `SUBMETIDA` — a equipe oficial (VIGENTE) permanece **intacta** até a aprovação.
5. Quando o Gestor do Polo **aprova**:
   - Solicitação passa a `APROVADA`
   - A versão `VIGENTE` anterior passa a `HISTORICO` e a nova `PROPOSTA` passa a `VIGENTE`
   - Mudanças passam a valer para a equipe oficial do projeto
6. Sistema disponibiliza endpoint `GET /solicitacoes/{id}/comparacao` para comparativo Antes vs. Depois com diferenças (inclusões, alterações campo a campo, encerramentos)
7. Sistema emite PDF com comparativo Antes / Alterações Solicitadas / Depois

> **Rejeição:** ao rejeitar uma `SUBMETIDA`, a `VIGENTE` original permanece inalterada (a PROPOSTA submetida nunca a substituiu), portanto a equipe do projeto continua exatamente como estava antes da submissão.

> **Idempotência:** se já existe uma `ALTERACAO` em `EM_EDICAO` para o projeto, o sistema reutiliza essa solicitação em vez de criar duplicata.

### 4.3 Pagamento de RH

1. Coordenador cria solicitação para mês/ano específico
2. Sistema lista pesquisadores ativos no período
3. Sistema calcula valores devidos
4. Emite PDF de solicitação de folha de pagamento

---

## 5. Fluxo de Transferência entre Projetos

1. Coordenador do projeto destino solicita transferência de pesquisador
2. Informa: pesquisador, projeto de origem, justificativa, carga horária
3. Sistema notifica coordenador do projeto de origem (cedente)
4. Coordenador cedente avalia e emite parecer: **Aceitar** ou **Recusar**
5. Se aceito: transferência é efetivada e registrada no histórico
6. Se recusado: registra motivo da recusa

**Regra crítica:** transferência só é efetivada com aceite digital do coordenador cedente.

---

## 6. Versionamento de RH

### 6.1 Ciclo de Vida das Versões

Cada solicitação de implantação ou alteração gera exatamente uma `Versao_RH_Projeto`. As versões seguem o ciclo:

```
PROPOSTA  --(aprovar)-->  VIGENTE  --(nova alteracao aprovada)-->  HISTORICO
```

A `submeter()` apenas move a solicitação de `EM_EDICAO` para `SUBMETIDA`; a transição
de versão (`PROPOSTA → VIGENTE`) só ocorre na **aprovação**, garantindo que inclusões
ou remoções nunca apareçam no projeto sem o consentimento do Gestor do Polo.

Invariantes:

- Cada projeto tem no máximo **uma** versão `VIGENTE` a qualquer momento
- Cada projeto tem no máximo **uma** versão `PROPOSTA` ativa a qualquer momento (associada à solicitação `EM_EDICAO` ou `SUBMETIDA` em aberto)
- Versões `HISTORICO` são imutáveis e usadas para auditoria

### 6.2 Comparação Antes vs. Depois

A comparação Antes/Depois é feita entre a `PROPOSTA` da solicitação e a versão com `numero_versao - 1` do mesmo projeto:

- Em `IMPLANTACAO`: não existe versão anterior; o Antes é vazio e todos os membros aparecem como `inclusoes`
- Em `ALTERACAO`: o Antes é a versão anterior (a última `VIGENTE` antes da submissão, ou ainda `VIGENTE` se a solicitação não foi submetida)
- Diferenças calculadas: `inclusoes` (refs presentes só no Depois), `encerramentos` (refs presentes só no Antes), `alteracoes` (refs comuns com mudança em categoria, fonte ou carga horária)

### 6.3 Pesquisador em Múltiplos Períodos

O mesmo pesquisador pode atuar mais de uma vez no mesmo projeto em períodos distintos (registros diferentes em `Pesquisador_Projeto` ligados a versões diferentes). Dentro de uma mesma versão, porém, um `ref_pesquisador` só pode aparecer uma vez.

---

## 7. Geração de Documentos PDF

### 7.1 PDF de Implantação Inicial

- Cabeçalho institucional
- Número da solicitação
- Título do projeto e coordenador
- Grid de pesquisadores (nome, função, fonte, CH, valor)
- Somatório de carga horária
- Somatório financeiro
- Data de emissão

### 7.2 PDF de Alteração de RH

- Cabeçalho institucional
- Número da solicitação
- Seção "Situação ANTES": equipe na versão anterior
- Seção "Alterações Solicitadas": o que muda
- Seção "Situação DEPOIS": equipe na versão proposta
- Justificativa
- Diferença de CH e valor
- Histórico de alterações
- Data de emissão

### 7.3 PDF de Folha de Pagamento

- Projeto e mês/ano de referência
- Número da solicitação
- Lista de pesquisadores com fonte, CH e valor individual
- Total da folha

---

## 8. Controle de Acesso por Perfil

| Funcionalidade | Admin | Coordenador | Gestor Polo | Apoio Coord. |
|----------------|-------|-------------|-------------|--------------|
| Gestão de usuários/perfis | X | | | |
| Parametrização (CH, bolsas, tipos) | X | | | |
| Gestão de projetos | X | X (seus projetos) | X (cadastrar, editar e consultar) | X (apoio) |
| Solicitações de RH | X | X (criar, editar, submeter e consultar seus projetos) | X (listar, visualizar, aprovar e rejeitar) | X (criar, editar e submeter como apoio) |
| Implantação/alteração de RH | X | X (seus projetos) | | X (apoio) |
| Transferências | X | X (como cedente ou destino) | X (consulta) | |
| Monitoramento multi-projeto | X | | X | |
| Emissão de PDFs | X | X (seus projetos) | X | X (apoio) |

---

## 9. Nota Técnica 03/2020

O sistema também deve respeitar as diretrizes da Nota Técnica 03/2020 no que se refere a limites e regras de alocação de pesquisadores.

---

## 10. Premissas

- As diretrizes da Resolução 11/2022 permanecerão em vigor durante o desenvolvimento
- Os modelos de ofícios em PDF exigidos pelo Polo permanecerão os mesmos
- O Product Owner terá disponibilidade semanal para dúvidas e homologação
