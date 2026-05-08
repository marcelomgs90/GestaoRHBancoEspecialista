# Modulos do Sistema

## Modulo 1: Controle de Acesso

### Funcionalidades

- **Login / Logout**
  - Autenticacao de usuario com e-mail e senha
  - Gerenciamento de sessao (token)
  - Validacao institucional quando necessario (via Banco de Especialistas)

- **Gestao de Perfis de Usuario**
  - Atribuicao de perfil: Administrador, Coordenador, Gestor do Polo, Apoio Coordenador
  - Controle de status (Ativo/Inativo)

---

## Modulo 2: Parametrizacao

### Funcionalidades

- **Gestao do Limite de Carga Horaria Global**
  - Consulta e alteracao do limite global
  - Registro de justificativa e data de vigencia para cada alteracao

- **Gestao da Tabela de Categorias e Valores (Resolucao 11/2022)**
  - Consulta e inclusao de categorias de bolsa
  - Controle de vigencia historica (inicio/fim) - alteracoes nao corrompem historico
  - Campos: nome da categoria, valor da bolsa, unidade de referencia, limites semanal/mensal, percentual aplicavel, fonte de financiamento permitida

- **Gestao dos Tipos de Solicitacao/Origem de RH**
  - Tipos: Pesquisador Prospector, Processo Seletivo, Transferencia entre Projetos
  - Cada tipo possui descricao e status

---

## Modulo 3: Projetos

### Funcionalidades

- **Gestao de Projetos**
  - Consulta, inclusao e alteracao de dados basicos
  - Campos: titulo, resumo, coordenador, status, datas (inicio/fim), fonte principal, observacao

- **Upload/Anexo de Documentos do Projeto**
  - Multiplos arquivos por projeto
  - Tipos: Plano de Trabalho, Acordo de Parceria, publicacao do extrato no Diario Oficial, aditivos e demais anexos
  - Campos: tipo de documento, numero/identificador, nome do arquivo, versao, indicador de ativo

- **Busca e Vinculacao de Especialista**
  - Consulta ao Banco de Especialistas (sistema externo)
  - Filtros: nome, identificador, tipo de vinculo, area, instituicao, situacao
  - Vinculacao do especialista ao projeto

---

## Modulo 4: Monitoramento

### Funcionalidades

- **Consulta/Relatorio da Equipe Alocada por Projeto**
  - Visualizacao por fonte de financiamento (EMBRAPII, EMPRESA, SEBRAE, IFPB)
  - Dados: pesquisador, fonte, carga horaria, valor da bolsa, periodo de atuacao, situacao

- **Visao Consolidada da Alocacao por Fonte**
  - Coordenador: visao do seu projeto especifico
  - Gestor do Polo: visao de multiplos projetos autorizados
  - Dados: fonte, projeto, quantidade de pesquisadores, somatorio CH, somatorio financeiro, percentual por fonte

---

## Modulo 5: Transferencia de RH

### Funcionalidades

- **Cadastro de Nova Solicitacao de Transferencia**
  - Pesquisador, projeto de origem, projeto de destino
  - Justificativa, carga horaria a transferir, fonte de financiamento

- **Consulta de Transferencias Pendentes de Aprovacao**

- **Consulta do Historico de Transferencias Realizadas**

- **Aprovacao/Aceite Sistemico pelo Coordenador Cedente**
  - Acoes: aceitar ou recusar
  - Campos: parecer, justificativa, motivo da recusa

### Regra de Negocio

Quando um pesquisador e transferido entre projetos, o coordenador do projeto de origem (cedente) deve dar aceite digital. A transferencia so e efetivada apos esse aceite.

---

## Modulo 6: Solicitacoes e Documentos

### Funcionalidades

- **Solicitacao de Implantacao Inicial de RH**
  - Composicao inicial da equipe do projeto
  - Lista de pesquisadores com fonte, carga horaria, valor de bolsa, categoria

- **Solicitacao de Alteracao de RH**
  - Modificacao da composicao da equipe
  - Tipo de alteracao, participacao atual vs. proposta, justificativa, data de vigencia

- **Solicitacao de Pagamento de RH**
  - Referente a um mes/ano especifico
  - Lista de pesquisadores com valores calculados

- **Inclusao de Participacao de Pesquisador**
  - Vinculacao de pesquisador a um projeto via solicitacao
  - Campos: fonte, carga horaria, categoria da bolsa, data de inicio

- **Alteracao de Participacao de Pesquisador**
  - Mudanca de carga horaria, valor, fonte, data de vigencia

- **Encerramento de Participacao de Pesquisador**
  - Data de encerramento, motivo, observacao, justificativa

- **Calculo Automatico e Validacao**
  - Valores de bolsas calculados com base na Resolucao 11/2022
  - Validacao de horas semanais contra limites globais
  - A partir das solicitacoes de implantacao ou alteracao

- **Visualizacao de Mudancas entre Versoes de RH**
  - Comparacao lado a lado: Versao Atual vs. Versao Proposta
  - Diferencas de carga horaria e valor
  - Alertas de violacao de regras

- **Registro Manual do Numero da Solicitacao**
  - Numero/identificador para inclusao nos PDFs
  - Apoio ao controle interno do Coordenador e do Polo

### Geracao de PDFs

| Documento | Conteudo |
|-----------|----------|
| **PDF de Implantacao/Alocacao Inicial** | Cabecalho institucional, numero da solicitacao, titulo do projeto, coordenador, grid de pesquisadores, somatorio de CH, somatorio financeiro, data de emissao |
| **PDF de Solicitacao de Alteracao de RH** | Cabecalho, numero da solicitacao, situacao ANTES, alteracoes solicitadas, situacao DEPOIS, justificativa, diferenca de CH/Valor, historico, data de emissao |
| **PDF de Solicitacao de Folha de Pagamento** | Projeto, mes/ano, numero da solicitacao, pesquisadores, fonte, carga horaria, valor por pesquisador, total da folha |
