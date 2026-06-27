# Módulos do Sistema

## Módulo 1: Controle de Acesso

### Funcionalidades

- **Login / Logout**
  - Autenticação de usuário com e-mail e senha
  - Gerenciamento de sessão (token)
  - Validação institucional quando necessário (via Banco de Especialistas)

- **Gestão de Perfis de Usuário**
  - Atribuição de perfil: Administrador, Coordenador, Gestor do Polo, Apoio Coordenador
  - Controle de status (Ativo/Inativo)

---

## Módulo 2: Parametrização

### Funcionalidades

- **Gestão do Limite de Carga Horária Global**
  - Consulta e alteração do limite global
  - Registro de justificativa e data de vigência para cada alteração

- **Gestão da Tabela de Categorias e Valores (Resolução 11/2022)**
  - Consulta e inclusão de categorias de bolsa
  - Controle de vigência histórica (início/fim) - alterações não corrompem histórico
  - Campos: nome da categoria, valor da bolsa, unidade de referência, limites semanal/mensal, percentual aplicável, fonte de financiamento permitida

- **Gestão dos Tipos de Solicitação/Origem de RH**
  - Tipos: Pesquisador Prospector, Processo Seletivo, Transferência entre Projetos
  - Cada tipo possui descrição e status

---

## Módulo 3: Projetos

### Funcionalidades

- **Gestão de Projetos**
  - Consulta, inclusão e alteração de dados básicos
  - Campos: título, sigla do projeto, código do projeto, resumo, coordenador, status, datas (início/fim), fonte principal, observação
  - A sigla do projeto é obrigatória, alfanumérica, com mínimo de 5 e máximo de 20 caracteres
  - O código do projeto é opcional; quando informado, deve ser único entre os projetos cadastrados
  - O código do projeto é digitado pelo usuário e não é gerado automaticamente pelo sistema

- **Upload/Anexo de Documentos do Projeto**
  - Múltiplos arquivos por projeto
  - Tipos: Plano de Trabalho, Acordo de Parceria, publicação do extrato no Diário Oficial, aditivos e demais anexos
  - Campos: tipo de documento, número/identificador, nome do arquivo, versão, indicador de ativo

- **Busca e Vinculação de Especialista**
  - Consulta ao Banco de Especialistas (sistema externo)
  - Filtros: nome, identificador, tipo de vínculo, área, instituição, situação
  - Vinculação do especialista ao projeto

---

## Módulo 4: Monitoramento

### Funcionalidades

- **Consulta/Relatório da Equipe Alocada por Projeto**
  - Visualização por fonte de financiamento (EMBRAPII, EMPRESA, SEBRAE)
  - Dados: pesquisador, fonte, carga horária, valor da bolsa, período de atuação, situação

- **Visão Consolidada da Alocação por Fonte**
  - Coordenador: visão do seu projeto específico
  - Gestor do Polo: visão de múltiplos projetos autorizados
  - Dados: fonte, projeto, quantidade de pesquisadores, somatório CH, somatório financeiro, percentual por fonte

---

## Módulo 5: Transferência de RH

### Funcionalidades

- **Cadastro de Nova Solicitação de Transferência**
  - Pesquisador, projeto de origem, projeto de destino
  - Justificativa, carga horária a transferir, fonte de financiamento

- **Consulta de Transferências Pendentes de Aprovação**

- **Consulta do Histórico de Transferências Realizadas**

- **Aprovação/Aceite Sistêmico pelo Coordenador Cedente**
  - Ações: aceitar ou recusar
  - Campos: parecer, justificativa, motivo da recusa

### Regra de Negócio

Quando um pesquisador é transferido entre projetos, o coordenador do projeto de origem (cedente) deve dar aceite digital. A transferência só é efetivada após esse aceite.

---

## Módulo 6: Solicitações e Documentos

### Ciclo de Vida da Solicitação

Toda solicitação de RH segue o ciclo:

```
EM_EDICAO  --(submeter)-->  SUBMETIDA  --(aprovar/rejeitar)-->  APROVADA | REJEITADA
```

E gera uma `Versao_RH_Projeto` que segue o ciclo paralelo (transição ocorre na **aprovação**):

```
PROPOSTA  --(aprovar)-->  VIGENTE  --(nova alteracao aprovada)-->  HISTORICO
```

Regras:

- Cada projeto pode ter **no máximo uma** solicitação `EM_EDICAO` por tipo (Implantação ou Alteração) ativa ao mesmo tempo
- O `submeter()` move apenas a solicitação para `SUBMETIDA` — a versão `PROPOSTA` permanece `PROPOSTA` e a `VIGENTE` (se houver) **permanece inalterada**
- Ao **aprovar** uma `IMPLANTACAO`: a versão `PROPOSTA` (n=1) passa a `VIGENTE`
- Ao **aprovar** uma `ALTERACAO`: a versão `VIGENTE` anterior passa a `HISTORICO` e a nova `PROPOSTA` passa a `VIGENTE`
- Ao **rejeitar**: a `VIGENTE` original se mantém intacta (a submissão nunca a substituiu) e a `PROPOSTA` é descartada
- A solicitação só é efetivamente persistida quando o usuário aciona Salvar/Submeter. Abrir a tela e sair sem acionar não cria registro
- Quando uma `ALTERACAO` é criada, o backend clona a equipe da versão `VIGENTE` para a nova `PROPOSTA` (base editável)

### Funcionalidades

- **Solicitação de Implantação Inicial de RH**
  - Composição inicial da equipe do projeto (primeira versão do RH)
  - Lista de pesquisadores com fonte, carga horária, valor de bolsa, categoria
  - Disponível apenas se o projeto **não** possui versão `VIGENTE`
  - Perfis permitidos: Coordenador do projeto, Administrador e Apoio Coordenador. Gestor do Polo não realiza implantação.

- **Solicitação de Alteração de RH**
  - Modificação da composição da equipe a partir da versão `VIGENTE`
  - Inclusões, alterações e encerramentos de participação
  - Justificativa e mês/ano de referência
  - Disponível apenas se o projeto possui versão `VIGENTE`
  - Perfis permitidos: Coordenador do projeto, Administrador e Apoio Coordenador. Gestor do Polo não realiza alteração de RH.

- **Solicitação de Pagamento de RH**
  - Referente a um mês/ano específico
  - Lista de pesquisadores com valores calculados

- **Inclusão de Participação de Pesquisador**
  - Vinculação de pesquisador a um projeto via solicitação
  - Campos: fonte, carga horária, categoria da bolsa, data de início
  - Um mesmo `ref_pesquisador` não pode ser incluído mais de uma vez na mesma versão

- **Alteração de Participação de Pesquisador**
  - Mudança de carga horária, valor, fonte, data de vigência

- **Encerramento de Participação de Pesquisador**
  - Aplicado quando um membro presente na versão `VIGENTE` é removido da `PROPOSTA`
  - Registra data e motivo

- **Cálculo Automático e Validação**
  - Valores de bolsas calculados via `ParametroService` (Resolução 11/2022)
  - Validação de carga horária global considera apenas alocações em versões `VIGENTE`
  - Alocações em versões `PROPOSTA` (rascunhos) são ignoradas na soma do CH global
  - Ao validar uma alteração no projeto X, as alocações do próprio projeto X em `VIGENTE` são excluídas da contagem (são substituídas pela nova proposta)

- **Submeter Solicitação**
  - Endpoint: `POST /solicitacoes/{id}/submeter`
  - Promove status `EM_EDICAO -> SUBMETIDA` apenas da solicitação
  - A versão `PROPOSTA` permanece `PROPOSTA` e a equipe oficial (VIGENTE) não é alterada
  - A transição de versão (`PROPOSTA → VIGENTE` e, em alteração, `VIGENTE → HISTORICO`) só ocorre na **aprovação**

- **Visualização de Mudanças entre Versões de RH**
  - Endpoint: `GET /solicitacoes/{id}/comparacao`
  - Retorna `antes` (versão anterior, vazia em implantação) e `depois` (versão desta solicitação) agrupados por fonte
  - Retorna `diferencas`: lista de inclusões, alterações (campo a campo) e encerramentos
  - UI exibe comparação lado a lado por fonte de financiamento

- **Registro Manual do Número da Solicitação**
  - Número/identificador (`identificador`) para inclusão nos PDFs
  - Apoio ao controle interno do Coordenador e do Polo

### Geração de PDFs

| Documento | Conteúdo |
|-----------|----------|
| **PDF de Implantação/Alocação Inicial** | Cabeçalho institucional, número da solicitação, título do projeto, coordenador, grid de pesquisadores, somatório de CH, somatório financeiro, data de emissão |
| **PDF de Solicitação de Alteração de RH** | Cabeçalho, número da solicitação, situação ANTES, alterações solicitadas, situação DEPOIS, justificativa, diferença de CH/Valor, histórico, data de emissão |
| **PDF de Solicitação de Folha de Pagamento** | Projeto, mês/ano, número da solicitação, pesquisadores, fonte, carga horária, valor por pesquisador, total da folha |
