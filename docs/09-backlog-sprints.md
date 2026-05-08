# Backlog Completo - Organizado por Sprint

Fonte: OpenProject (backlog_openproject_banco_especialistas_v2.xlsx)

> **Atualizacao v2:** introduzida a prioridade **Imediata** (acima de Alta) e revisadas as prioridades das User Stories conforme repriorizacao do PO. Prioridades aceitas: **Imediata, Alta, Normal, Baixa**.

---

## Hierarquia do Projeto

```
EP-00 Aplicacao Web - Gestao RH Banco de Especialistas
  |-- EP-01 Modulo Controle de Acesso
  |-- EP-02 Modulo Solicitacoes e Documentos
  |-- EP-03 Modulo Projetos e Anexos
  |-- EP-04 Modulo Banco de Especialistas e Vinculos
  |-- EP-05 Modulo Monitoramento
  |-- EP-06 Modulo Transferencia de RH
  |-- EP-07 Modulo Parametrizacao
  |-- EP-08 Atividades Auxiliares e Qualidade
```

## Resumo das Sprints

| Sprint | US | Story Points | Esforco (h) | Foco |
|--------|-----|-------------|-------------|------|
| Sprint 1 - Solicitacoes de RH Base (MVP) | 9 | 53 | 72 | Fluxo principal de solicitacoes, validacoes e ambiente inicial |
| Sprint 2 - Projetos e Banco de Especialistas | 7 | 31 | 56 | Projetos, anexos, especialistas e vinculos |
| Sprint 3 - Monitoramento e Documentos | 7 | 31 | 56 | PDFs, pagamento e relatorios |
| Sprint 4 - Transferencia e Parametrizacao | 6 | 24 | 48 | Transferencia de RH, parametrizacao e evidencias finais |
| **Total** | **29** | **139** | **232** | |

---

## Distribuicao por Responsavel

| Responsavel | Funcao | Tags de Task |
|-------------|--------|-------------|
| Vinicius Lopes de Alencar | Back-end | [back], [devops/doc] |
| Marcelo Gomes da Silva | Back-end | [back], [devops/doc] |
| Lindomar da Silva Junior | Front-end | [front] |
| Lucas Matheus Santos da Silva | Front-end | [front] |
| Carolina Araujo de Sousa | QA | [qa] |
| Erick Victor Carvalho de Araujo | PO | [doc] |

---

# Sprint 1 - Solicitacoes de RH Base (MVP)

**Objetivo:** Entregar o fluxo central de solicitacao de RH com dados/regras mockadas quando necessario.

**Metricas:** 9 US | 53 Story Points | 72 horas estimadas

---

### US-AQ-01 | Preparar ambiente inicial do projeto (5 pts)

**Feature:** F-AQ-01 - Preparacao do ambiente e repositorio (EP-08)
**Prioridade:** Baixa

**Descricao:** Como equipe tecnica, quero preparar repositorio e ambiente para iniciar o desenvolvimento com rastreabilidade.

**BDD:** DADO que o projeto foi iniciado, QUANDO o ambiente for configurado, ENTAO frontend e backend devem executar localmente com documentacao minima.

**Criterios de Aceitacao:**
- CA-F-AQ-01-01: O repositorio deve estar criado com estrutura de branches minima
- CA-F-AQ-01-02: O ambiente local deve executar frontend e backend
- CA-F-AQ-01-03: As variaveis de ambiente essenciais devem estar documentadas

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-AQ-01-01 [devops/doc] Preparar artefatos tecnicos | Marcelo Gomes da Silva | 3 |
| TK-US-AQ-01-02 [doc] Documentar evidencias/configuracao | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-01-03 [qa] Validar evidencias e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

### US-AQ-02 | Criar banco inicial com dados mockados (5 pts)

**Feature:** F-AQ-02 - Modelagem do banco de dados e migracoes (EP-08)
**Prioridade:** Normal

**Descricao:** Como equipe tecnica, quero criar a estrutura inicial do banco com dados mockados para antecipar validacoes da Sprint 1.

**BDD:** DADO que as entidades principais foram definidas, QUANDO as migracoes forem executadas, ENTAO a base deve permitir testar solicitacoes de RH.

**Criterios de Aceitacao:**
- CA-F-AQ-02-01: As tabelas principais devem possuir migracoes iniciais
- CA-F-AQ-02-02: As relacoes devem seguir o DER revisado
- CA-F-AQ-02-03: A base deve possuir dados mockados minimos para Sprint 1

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-AQ-02-01 [devops/doc] Preparar artefatos tecnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-02-02 [doc] Documentar evidencias/configuracao | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-02-03 [qa] Validar evidencias e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

### US-CA-01 | Login e logout (3 pts)

**Feature:** F-CA-01 - Autenticacao e sessao de usuarios (EP-01)
**Prioridade:** Alta

**Descricao:** Como usuario autorizado, quero acessar o sistema com seguranca para utilizar as funcoes conforme meu perfil.

**BDD:** DADO que o usuario possui credenciais validas, QUANDO informar login e senha e confirmar, ENTAO o sistema deve criar a sessao e direcionar para a area inicial.

**Criterios de Aceitacao:**
- CA-F-CA-01-01: O usuario deve autenticar-se com credenciais validas
- CA-F-CA-01-02: O sistema deve bloquear acesso a rotas protegidas sem sessao ativa
- CA-F-CA-01-03: O usuario deve conseguir encerrar a sessao com seguranca

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-CA-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-CA-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-CA-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-CA-02 | Aplicacao de perfis no menu (3 pts)

**Feature:** F-CA-02 - Gestao de perfis e permissoes (EP-01)
**Prioridade:** Normal

**Descricao:** Como administrador, quero que o menu respeite o perfil do usuario para evitar acesso indevido.

**BDD:** DADO que o usuario esteja autenticado, QUANDO acessar o menu, ENTAO o sistema deve exibir apenas as opcoes permitidas para seu perfil.

**Criterios de Aceitacao:**
- CA-F-CA-02-01: O sistema deve controlar permissoes por perfil
- CA-F-CA-02-02: Apenas perfis autorizados devem acessar funcoes administrativas
- CA-F-CA-02-03: Os perfis Administrador, Coordenador, Gestor do Polo e Apoio Coordenador devem estar disponiveis

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-CA-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-CA-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-CA-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-01 | Criar solicitacao de implantacao inicial (8 pts)

**Feature:** F-SD-01 - Solicitacao de implantacao inicial de RH (EP-02)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero criar uma solicitacao de implantacao inicial de RH para iniciar a equipe de um projeto.

**BDD:** DADO que exista um projeto selecionado, QUANDO o coordenador iniciar a implantacao inicial, ENTAO o sistema deve criar uma solicitacao vinculada ao projeto.

**Criterios de Aceitacao:**
- CA-F-SD-01-01: A implantacao inicial deve estar vinculada a um projeto ativo
- CA-F-SD-01-02: A solicitacao deve possuir membros e fontes de financiamento validas
- CA-F-SD-01-03: A solicitacao deve receber identificador manual/informado pelo usuario quando aplicavel

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-02 | Incluir membro na solicitacao de RH (8 pts)

**Feature:** F-SD-03 - Inclusao, alteracao e encerramento de membros (EP-02)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero incluir membros na solicitacao de RH para compor a equipe do projeto.

**BDD:** DADO que exista uma solicitacao em edicao, QUANDO o coordenador informar especialista, perfil, fonte e vigencia, ENTAO o membro deve ser incluido na proposta.

**Criterios de Aceitacao:**
- CA-F-SD-03-01: O sistema deve permitir inclusao, alteracao e encerramento de membros
- CA-F-SD-03-02: O sistema deve validar carga horaria maxima e regras de bolsas
- CA-F-SD-03-03: O sistema deve registrar vigencia, fonte e perfil de cada vinculo

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-03 | Validar carga horaria e bolsa do membro (8 pts)

**Feature:** F-SD-03 - Inclusao, alteracao e encerramento de membros (EP-02)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero que o sistema valide carga horaria e bolsa para reduzir erros administrativos.

**BDD:** DADO que um membro foi informado, QUANDO a carga horaria ou categoria for alterada, ENTAO o sistema deve validar limites e informar inconsistencias.

**Criterios de Aceitacao:**
- CA-F-SD-03-02: O sistema deve validar carga horaria maxima e regras de bolsas
- CA-F-SD-03-03: O sistema deve registrar vigencia, fonte e perfil de cada vinculo

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-03-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-03-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-03-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-04 | Criar solicitacao de alteracao de RH (8 pts)

**Feature:** F-SD-02 - Solicitacao de alteracao de RH (EP-02)
**Prioridade:** Alta

**Descricao:** Como coordenador, quero abrir uma alteracao de RH para mudar uma equipe ja implantada.

**BDD:** DADO que exista uma versao vigente de RH, QUANDO o coordenador solicitar alteracao, ENTAO o sistema deve criar uma versao proposta separada da atual.

**Criterios de Aceitacao:**
- CA-F-SD-02-01: A alteracao deve partir de uma versao de RH ja existente
- CA-F-SD-02-02: O sistema deve permitir registrar motivo e dados alterados
- CA-F-SD-02-03: A versao proposta deve ficar separada da versao atual ate homologacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-04-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-04-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-04-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-05 | Comparar equipe atual e proposta (5 pts)

**Feature:** F-SD-04 - Versoes de RH e comparacao Atual x Proposta (EP-02)
**Prioridade:** Alta

**Descricao:** Como gestor, quero comparar equipe atual e proposta para entender as mudancas antes da homologacao.

**BDD:** DADO que exista uma versao atual e uma proposta, QUANDO o usuario abrir a comparacao, ENTAO o sistema deve exibir inclusoes, alteracoes e encerramentos.

**Criterios de Aceitacao:**
- CA-F-SD-04-01: O sistema deve listar versoes de RH por projeto
- CA-F-SD-04-02: O sistema deve comparar equipe atual e equipe proposta
- CA-F-SD-04-03: As diferencas devem ser exibidas de forma clara para homologacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-05-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-05-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-05-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

# Sprint 2 - Projetos e Banco de Especialistas

**Objetivo:** Cadastrar projetos, anexos e consultar/vincular especialistas.

**Metricas:** 7 US | 31 Story Points | 56 horas estimadas

---

### US-PR-01 | Cadastrar projeto (5 pts)

**Feature:** F-PR-01 - Cadastro e manutencao de projetos (EP-03)
**Prioridade:** Imediata

**Descricao:** Como gestor do Polo, quero cadastrar projetos para que solicitacoes de RH sejam vinculadas corretamente.

**BDD:** DADO que o usuario tenha permissao, QUANDO preencher os dados obrigatorios do projeto, ENTAO o sistema deve salvar o projeto ativo.

**Criterios de Aceitacao:**
- CA-F-PR-01-01: O projeto deve possuir dados basicos obrigatorios
- CA-F-PR-01-02: O sistema deve permitir consulta, inclusao e alteracao de projeto
- CA-F-PR-01-03: Projetos inativos nao devem aparecer como opcao principal para novas solicitacoes

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PR-01-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PR-01-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PR-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-02 | Consultar e alterar projeto (3 pts)

**Feature:** F-PR-01 - Cadastro e manutencao de projetos (EP-03)
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero consultar e alterar projetos para manter dados atualizados.

**BDD:** DADO que existam projetos cadastrados, QUANDO o usuario pesquisar e editar um projeto, ENTAO as alteracoes validas devem ser persistidas.

**Criterios de Aceitacao:**
- CA-F-PR-01-01: O projeto deve possuir dados basicos obrigatorios
- CA-F-PR-01-02: O sistema deve permitir consulta, inclusao e alteracao de projeto

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PR-02-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PR-02-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PR-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-03 | Gerenciar anexos multiplos do projeto (5 pts)

**Feature:** F-PR-02 - Anexos multiplos do projeto (EP-03)
**Prioridade:** Normal

**Descricao:** Como apoio coordenador, quero anexar documentos do projeto para manter o processo completo.

**BDD:** DADO que o projeto esteja cadastrado, QUANDO o usuario anexar arquivos, ENTAO o sistema deve registrar tipo, data e arquivo para consulta.

**Criterios de Aceitacao:**
- CA-F-PR-02-01: O sistema deve permitir multiplos anexos por projeto
- CA-F-PR-02-02: Cada anexo deve possuir tipo, data e arquivo associado
- CA-F-PR-02-03: A lista de anexos deve permitir consulta posterior

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PR-03-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PR-03-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PR-03-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-BE-01 | Consultar especialista (5 pts)

**Feature:** F-BE-01 - Consulta ao Banco de Especialistas (EP-04)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero consultar o Banco de Especialistas para localizar pesquisadores aptos.

**BDD:** DADO que exista uma base de especialistas disponivel, QUANDO pesquisar por nome, matricula ou perfil, ENTAO o sistema deve listar resultados compativeis.

**Criterios de Aceitacao:**
- CA-F-BE-01-01: A consulta deve permitir buscar especialista por nome, matricula/identificador ou perfil
- CA-F-BE-01-02: A consulta deve retornar dados minimos necessarios para vinculacao
- CA-F-BE-01-03: Ausencia de resultado deve gerar mensagem clara ao usuario

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-BE-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-BE-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-BE-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-BE-02 | Vincular pesquisador ao projeto (5 pts)

**Feature:** F-BE-02 - Vinculacao de pesquisador ao projeto (EP-04)
**Prioridade:** Alta

**Descricao:** Como coordenador, quero vincular pesquisador ao projeto para montar a equipe de RH.

**BDD:** DADO que o pesquisador foi localizado, QUANDO informar projeto, perfil, origem, fonte e vigencia, ENTAO o vinculo deve ser registrado.

**Criterios de Aceitacao:**
- CA-F-BE-02-01: A vinculacao deve exigir projeto, especialista, perfil, fonte e vigencia
- CA-F-BE-02-02: A origem de RH deve ser informada conforme tipos cadastrados
- CA-F-BE-02-03: O sistema deve registrar historico da vinculacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-BE-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-BE-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-BE-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-04 | Vincular coordenador/especialista responsavel pelo projeto (5 pts)

**Feature:** F-PR-03 - Vinculacao de coordenador/especialista ao projeto (EP-03)
**Prioridade:** Alta

**Descricao:** Como gestor do Polo, quero vincular o coordenador/especialista responsavel para identificar o responsavel pelo projeto.

**BDD:** DADO que o projeto e especialista existam, QUANDO o gestor confirmar a vinculacao, ENTAO o projeto deve registrar o responsavel vigente.

**Criterios de Aceitacao:**
- CA-F-PR-03-01: O coordenador/especialista deve ser localizado no Banco de Especialistas
- CA-F-PR-03-02: A vinculacao deve registrar papel e vigencia
- CA-F-PR-03-03: O sistema deve impedir vinculo duplicado ativo para a mesma funcao quando aplicavel

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PR-04-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PR-04-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PR-04-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-03 | Evoluir DER e migracoes da Sprint 2 (3 pts)

**Feature:** F-AQ-02 - Modelagem do banco de dados e migracoes (EP-08)
**Prioridade:** Baixa

**Descricao:** Como equipe tecnica, quero evoluir o banco para projetos, anexos e vinculos para suportar as features da Sprint 2.

**BDD:** DADO que a base inicial existe, QUANDO forem aplicadas novas migracoes, ENTAO projetos, anexos e vinculos devem ser armazenados corretamente.

**Criterios de Aceitacao:**
- CA-F-AQ-02-01: As tabelas principais devem possuir migracoes iniciais
- CA-F-AQ-02-02: As relacoes devem seguir o DER revisado

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-AQ-03-01 [devops/doc] Preparar artefatos tecnicos | Marcelo Gomes da Silva | 3 |
| TK-US-AQ-03-02 [doc] Documentar evidencias/configuracao | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-03-03 [qa] Validar evidencias e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Sprint 3 - Monitoramento e Documentos

**Objetivo:** Emitir documentos PDF e consultas/relatorios consolidados.

**Metricas:** 7 US | 31 Story Points | 56 horas estimadas

---

### US-SD-06 | Criar solicitacao de pagamento por competencia (5 pts)

**Feature:** F-SD-05 - Solicitacao de pagamento de RH por mes/ano (EP-02)
**Prioridade:** Alta

**Descricao:** Como coordenador, quero solicitar pagamento de RH por mes e ano para gerar a documentacao da competencia.

**BDD:** DADO que exista equipe vigente, QUANDO o coordenador informar mes e ano, ENTAO o sistema deve listar membros ativos e valores da competencia.

**Criterios de Aceitacao:**
- CA-F-SD-05-01: A solicitacao de pagamento deve exigir mes e ano de referencia
- CA-F-SD-05-02: O sistema deve listar somente membros ativos na competencia
- CA-F-SD-05-03: O pagamento deve considerar fonte e carga horaria vigente

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-06-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-06-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-06-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-07 | Gerar PDF de implantacao inicial (5 pts)

**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados (EP-02)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero gerar PDF de implantacao inicial para anexar ao processo administrativo.

**BDD:** DADO que a implantacao inicial esteja valida, QUANDO o usuario acionar a emissao, ENTAO o PDF deve ser gerado no padrao definido.

**Criterios de Aceitacao:**
- CA-F-SD-06-01: O sistema deve gerar PDF de implantacao inicial

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-07-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-07-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-07-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-08 | Gerar PDF de alteracao de RH (5 pts)

**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados (EP-02)
**Prioridade:** Imediata

**Descricao:** Como coordenador, quero gerar PDF de alteracao de RH com estado atual e proposto para formalizar mudancas.

**BDD:** DADO que exista alteracao de RH validada, QUANDO o usuario emitir o documento, ENTAO o PDF deve apresentar as informacoes antes e depois.

**Criterios de Aceitacao:**
- CA-F-SD-06-02: O sistema deve gerar PDF de alteracao de RH
- CA-F-SD-04-02: O sistema deve comparar equipe atual e equipe proposta
- CA-F-SD-04-03: As diferencas devem ser exibidas de forma clara para homologacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-08-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-08-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-08-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-09 | Gerar PDF de folha/solicitacao de pagamento (5 pts)

**Feature:** F-SD-06 - Geracao automatizada de PDFs padronizados (EP-02)
**Prioridade:** Alta

**Descricao:** Como coordenador, quero gerar PDF de folha de pagamento para a competencia selecionada.

**BDD:** DADO que a solicitacao de pagamento foi calculada, QUANDO o usuario emitir o documento, ENTAO o PDF deve listar membros, fonte, horas e valores.

**Criterios de Aceitacao:**
- CA-F-SD-06-03: O sistema deve gerar PDF de folha/solicitacao de pagamento
- CA-F-SD-05-01: A solicitacao de pagamento deve exigir mes e ano de referencia
- CA-F-SD-05-02: O sistema deve listar somente membros ativos na competencia

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-SD-09-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-09-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-09-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-MO-01 | Consultar alocacao por projeto, fonte e perfil (5 pts)

**Feature:** F-MO-01 - Consulta e relatorio de alocacao por projeto, fonte e perfil (EP-05)
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero consultar alocacao por projeto, fonte e perfil para acompanhar a composicao das equipes.

**BDD:** DADO que existam vinculos cadastrados, QUANDO aplicar filtros de projeto, fonte ou perfil, ENTAO o relatorio deve exibir os dados vigentes.

**Criterios de Aceitacao:**
- CA-F-MO-01-01: O relatorio deve permitir filtrar por projeto, fonte e perfil
- CA-F-MO-01-02: O relatorio deve permitir exportar/visualizar dados consolidados
- CA-F-MO-01-03: Os dados devem refletir a versao vigente de RH

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-MO-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-MO-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-MO-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-MO-02 | Visualizar consolidacao por fonte (3 pts)

**Feature:** F-MO-02 - Visao consolidada por fonte de financiamento (EP-05)
**Prioridade:** Normal

**Descricao:** Como gestor do Polo, quero visualizar a distribuicao por fonte de financiamento para acompanhar EMBRAPII, EMPRESA, SEBRAE e IFPB.

**BDD:** DADO que existam vinculos com fontes cadastradas, QUANDO abrir a visao consolidada, ENTAO o sistema deve apresentar totais separados por fonte.

**Criterios de Aceitacao:**
- CA-F-MO-02-01: A visao deve separar fontes EMBRAPII, EMPRESA, SEBRAE e IFPB
- CA-F-MO-02-02: O sistema deve apresentar totais por fonte
- CA-F-MO-02-03: A consulta deve considerar apenas vinculos ativos ou vigentes no filtro

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-MO-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-MO-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-MO-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-04 | Registrar evidencias de testes da Sprint 3 (3 pts)

**Feature:** F-AQ-03 - Qualidade, evidencias e apoio ao OpenProject (EP-08)
**Prioridade:** Baixa

**Descricao:** Como QA, quero registrar evidencias de testes para comprovar a execucao das US da sprint.

**BDD:** DADO que as US estejam implementadas, QUANDO os testes forem realizados, ENTAO as evidencias devem ser organizadas para entrega.

**Criterios de Aceitacao:**
- CA-F-AQ-03-01: Cada US deve possuir evidencia de teste ou validacao
- CA-F-AQ-03-03: O PDF de evidencias deve comprovar criterios, BDD, tasks, horas e responsaveis

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-AQ-04-01 [devops/doc] Preparar artefatos tecnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-04-02 [doc] Documentar evidencias/configuracao | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-04-03 [qa] Validar evidencias e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Sprint 4 - Transferencia e Parametrizacao

**Objetivo:** Finalizar transferencias, parametrizacao e homologacao integrada.

**Metricas:** 6 US | 24 Story Points | 48 horas estimadas

---

### US-TR-01 | Solicitar transferencia de pesquisador (5 pts)

**Feature:** F-TR-01 - Solicitacao de transferencia de RH (EP-06)
**Prioridade:** Imediata

**Descricao:** Como coordenador solicitante, quero pedir transferencia de pesquisador entre projetos para reaproveitar especialistas.

**BDD:** DADO que exista pesquisador vinculado em projeto origem, QUANDO informar projeto destino e justificativa, ENTAO o sistema deve criar pendencia de aceite.

**Criterios de Aceitacao:**
- CA-F-TR-01-01: A transferencia deve indicar projeto origem, projeto destino e pesquisador
- CA-F-TR-01-02: A transferencia deve gerar pendencia para o coordenador cedente
- CA-F-TR-01-03: A solicitacao deve manter status de acompanhamento

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-TR-01-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-TR-01-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-TR-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-TR-02 | Aceitar ou recusar transferencia (5 pts)

**Feature:** F-TR-02 - Aceite ou recusa pelo coordenador cedente (EP-06)
**Prioridade:** Imediata

**Descricao:** Como coordenador cedente, quero aceitar ou recusar transferencia para controlar saida de pesquisador do meu projeto.

**BDD:** DADO que exista uma pendencia de transferencia, QUANDO o coordenador cedente aceitar ou recusar, ENTAO o sistema deve atualizar o status e registrar a decisao.

**Criterios de Aceitacao:**
- CA-F-TR-02-01: O coordenador cedente deve conseguir aceitar ou recusar a transferencia
- CA-F-TR-02-02: A recusa deve exigir justificativa
- CA-F-TR-02-03: O aceite deve liberar a transferencia para continuidade/homologacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-TR-02-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-TR-02-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-TR-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-TR-03 | Consultar historico de transferencias (3 pts)

**Feature:** F-TR-03 - Historico de transferencias (EP-06)
**Prioridade:** Baixa

**Descricao:** Como gestor do Polo, quero consultar historico de transferencias para manter rastreabilidade administrativa.

**BDD:** DADO que existam transferencias registradas, QUANDO aplicar filtros de status/projeto, ENTAO o sistema deve exibir historico com datas e responsaveis.

**Criterios de Aceitacao:**
- CA-F-TR-03-01: O sistema deve listar transferencias por status
- CA-F-TR-03-02: O historico deve preservar datas, responsaveis e justificativas
- CA-F-TR-03-03: A consulta deve permitir rastrear a solicitacao associada

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-TR-03-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-TR-03-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-TR-03-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-PA-01 | Cadastrar regra de carga horaria e bolsa com vigencia (5 pts)

**Feature:** F-PA-01 - Parametrizacao de carga horaria, bolsas e vigencia (EP-07)
**Prioridade:** Alta

**Descricao:** Como administrador, quero cadastrar regras com vigencia para controlar calculos sem alterar codigo.

**BDD:** DADO que o administrador esteja no modulo de parametrizacao, QUANDO informar valores, limites e vigencia, ENTAO a regra deve ser salva e validada.

**Criterios de Aceitacao:**
- CA-F-PA-01-01: O administrador deve cadastrar regras com vigencia
- CA-F-PA-01-02: Alteracoes novas nao devem corromper calculos historicos
- CA-F-PA-01-03: Valores e limites devem ser validados antes de salvar

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PA-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PA-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PA-01-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-PA-02 | Cadastrar tipos de solicitacao/origem de RH (3 pts)

**Feature:** F-PA-02 - Parametrizacao de tipos de solicitacao/origem de RH (EP-07)
**Prioridade:** Normal

**Descricao:** Como administrador, quero manter tipos de solicitacao/origem de RH (pesquisador prospector, processo seletivo e transferencia entre projetos) para padronizar os fluxos do sistema.

**BDD:** DADO que o administrador tenha permissao, QUANDO cadastrar ou inativar um tipo, ENTAO o sistema deve refletir a mudanca nos formularios.

**Criterios de Aceitacao:**
- CA-F-PA-02-01: O administrador deve manter tipos de solicitacao/origem de RH
- CA-F-PA-02-02: Tipos inativos nao devem aparecer em novos cadastros
- CA-F-PA-02-03: O sistema deve manter historico de alteracoes de parametrizacao

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-PA-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PA-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PA-02-03 [qa] Testar BDD e criterios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-05 | Consolidar bugs, melhorias e evidencias finais (3 pts)

**Feature:** F-AQ-03 - Qualidade, evidencias e apoio ao OpenProject (EP-08)
**Prioridade:** Baixa

**Descricao:** Como equipe, quero consolidar evidencias finais e registrar bugs/melhorias para demonstrar rastreabilidade da entrega.

**BDD:** DADO que as sprints foram executadas, QUANDO finalizar a entrega, ENTAO o OpenProject deve conter evidencias, bugs/melhorias e registros atualizados.

**Criterios de Aceitacao:**
- CA-F-AQ-03-01: Cada US deve possuir evidencia de teste ou validacao
- CA-F-AQ-03-02: Bugs e melhorias devem ser registrados na versao correta
- CA-F-AQ-03-03: O PDF de evidencias deve comprovar criterios, BDD, tasks, horas e responsaveis

| Task | Responsavel | Horas |
|------|-------------|-------|
| TK-US-AQ-05-01 [devops/doc] Preparar artefatos tecnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-05-02 [doc] Documentar evidencias/configuracao | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-05-03 [qa] Validar evidencias e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Versao de Bugs/Melhorias

**BUGS/MELHORIAS - Banco de Especialistas** (Kanban)

Versao especifica para registrar bugs e melhorias apos homologacoes e testes. Nao misturar com novas US.
