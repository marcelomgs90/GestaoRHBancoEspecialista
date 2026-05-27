# Backlog Completo - Organizado por Sprint

Fonte: OpenProject (backlog_openproject_banco_especialistas_v2.xlsx)

> **Atualização v2:** introduzida a prioridade **Imediata** (acima de Alta) e revisadas as prioridades das User Stories conforme repriorização do PO. Prioridades aceitas: **Imediata, Alta, Normal, Baixa**.

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

| Sprint | US | Story Points | Esforço (h) | Foco |
|--------|-----|-------------|-------------|------|
| Sprint 1 - Solicitações de RH Base (MVP) | 9 | 53 | 72 | Fluxo principal de solicitações, validações e ambiente inicial |
| Sprint 2 - Projetos e Banco de Especialistas | 7 | 31 | 56 | Projetos, anexos, especialistas e vínculos |
| Sprint 3 - Monitoramento e Documentos | 7 | 31 | 56 | PDFs, pagamento e relatórios |
| Sprint 4 - Transferência e Parametrização | 6 | 24 | 48 | Transferência de RH, parametrização e evidências finais |
| **Total** | **29** | **139** | **232** | |

---

## Distribuição por Responsável

| Responsável | Função | Tags de Task |
|-------------|--------|-------------|
| Vinicius Lopes de Alencar | Back-end | [back], [devops/doc] |
| Marcelo Gomes da Silva | Back-end | [back], [devops/doc] |
| Lindomar da Silva Junior | Front-end | [front] |
| Lucas Matheus Santos da Silva | Front-end | [front] |
| Carolina Araujo de Sousa | QA | [qa] |
| Erick Victor Carvalho de Araujo | PO | [doc] |

---

# Sprint 1 - Solicitações de RH Base (MVP)

**Objetivo:** Entregar o fluxo central de solicitação de RH com dados/regras mockadas quando necessário.

**Métricas:** 9 US | 53 Story Points | 72 horas estimadas

---

### US-AQ-01 | Preparar ambiente inicial do projeto (5 pts)

**Feature:** F-AQ-01 - Preparacao do ambiente e repositorio (EP-08)
**Prioridade:** Baixa

**Descrição:** Como equipe técnica, quero preparar repositório e ambiente para iniciar o desenvolvimento com rastreabilidade.

**BDD:** DADO que o projeto foi iniciado, QUANDO o ambiente for configurado, ENTAO frontend e backend devem executar localmente com documentação mínima.

**Critérios de Aceitação:**
- CA-F-AQ-01-01: O repositório deve estar criado com estrutura de branches mínima
- CA-F-AQ-01-02: O ambiente local deve executar frontend e backend
- CA-F-AQ-01-03: As variáveis de ambiente essenciais devem estar documentadas

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-AQ-01-01 [devops/doc] Preparar artefatos técnicos | Marcelo Gomes da Silva | 3 |
| TK-US-AQ-01-02 [doc] Documentar evidências/configuração | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-01-03 [qa] Validar evidências e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

### US-AQ-02 | Criar banco inicial com dados mockados (5 pts)

**Feature:** F-AQ-02 - Modelagem do banco de dados e migrações (EP-08)
**Prioridade:** Normal

**Descrição:** Como equipe técnica, quero criar a estrutura inicial do banco com dados mockados para antecipar validações da Sprint 1.

**BDD:** DADO que as entidades principais foram definidas, QUANDO as migrações forem executadas, ENTAO a base deve permitir testar solicitações de RH.

**Critérios de Aceitação:**
- CA-F-AQ-02-01: As tabelas principais devem possuir migracoes iniciais
- CA-F-AQ-02-02: As relacoes devem seguir o DER revisado
- CA-F-AQ-02-03: A base deve possuir dados mockados minimos para Sprint 1

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-AQ-02-01 [devops/doc] Preparar artefatos técnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-02-02 [doc] Documentar evidências/configuração | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-02-03 [qa] Validar evidências e rastreabilidade | Carolina Araujo de Sousa | 2 |
---

### US-CA-01 | Login e logout (3 pts)

**Feature:** F-CA-01 - Autenticação e sessão de usuários (EP-01)
**Prioridade:** Alta

**Descrição:** Como usuário autorizado, quero acessar o sistema com segurança para utilizar as funções conforme meu perfil.

**BDD:** DADO que o usuário possui credenciais válidas, QUANDO informar login e senha e confirmar, ENTAO o sistema deve criar a sessão e direcionar para a área inicial.

**Critérios de Aceitação:**
- CA-F-CA-01-01: O usuário deve autenticar-se com credenciais válidas
- CA-F-CA-01-02: O sistema deve bloquear acesso a rotas protegidas sem sessão ativa
- CA-F-CA-01-03: O usuário deve conseguir encerrar a sessão com segurança

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-CA-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-CA-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-CA-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-CA-02 | Aplicação de perfis no menu (3 pts)

**Feature:** F-CA-02 - Gestão de perfis e permissões (EP-01)
**Prioridade:** Normal

**Descrição:** Como administrador, quero que o menu respeite o perfil do usuário para evitar acesso indevido.

**BDD:** DADO que o usuário esteja autenticado, QUANDO acessar o menu, ENTAO o sistema deve exibir apenas as opções permitidas para seu perfil.

**Critérios de Aceitação:**
- CA-F-CA-02-01: O sistema deve controlar permissões por perfil
- CA-F-CA-02-02: Apenas perfis autorizados devem acessar funções administrativas
- CA-F-CA-02-03: Os perfis Administrador, Coordenador, Gestor do Polo e Apoio Coordenador devem estar disponíveis

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-CA-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-CA-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-CA-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |
---

### US-SD-01 | Criar solicitação de implantação inicial (8 pts)

**Feature:** F-SD-01 - Solicitação de implantação inicial de RH (EP-02)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero criar uma solicitação de implantação inicial de RH para iniciar a equipe de um projeto.

**BDD:** DADO que exista um projeto selecionado, QUANDO o coordenador iniciar a implantação inicial, ENTAO o sistema deve criar uma solicitação vinculada ao projeto.

**Critérios de Aceitação:**
- CA-F-SD-01-01: A implantação inicial deve estar vinculada a um projeto ativo
- CA-F-SD-01-02: A solicitação deve possuir membros e fontes de financiamento válidas
- CA-F-SD-01-03: A solicitação deve receber identificador manual/informado pelo usuário quando aplicável

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-02 | Incluir membro na solicitação de RH (8 pts)

**Feature:** F-SD-03 - Inclusão, alteração e encerramento de membros (EP-02)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero incluir membros na solicitação de RH para compor a equipe do projeto.

**BDD:** DADO que exista uma solicitação em edição, QUANDO o coordenador informar especialista, perfil, fonte e vigência, ENTAO o membro deve ser incluído na proposta.

**Critérios de Aceitação:**
- CA-F-SD-03-01: O sistema deve permitir inclusão, alteração e encerramento de membros
- CA-F-SD-03-02: O sistema deve validar carga horária máxima e regras de bolsas
- CA-F-SD-03-03: O sistema deve registrar vigência, fonte e perfil de cada vínculo

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-03 | Validar carga horária e bolsa do membro (8 pts)

**Feature:** F-SD-03 - Inclusão, alteração e encerramento de membros (EP-02)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero que o sistema valide carga horária e bolsa para reduzir erros administrativos.

**BDD:** DADO que um membro foi informado, QUANDO a carga horária ou categoria for alterada, ENTAO o sistema deve validar limites e informar inconsistências.

**Critérios de Aceitação:**
- CA-F-SD-03-02: O sistema deve validar carga horária máxima e regras de bolsas
- CA-F-SD-03-03: O sistema deve registrar vigência, fonte e perfil de cada vínculo

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-03-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-03-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-03-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-04 | Criar solicitação de alteração de RH (8 pts)

**Feature:** F-SD-02 - Solicitação de alteração de RH (EP-02)
**Prioridade:** Alta

**Descrição:** Como coordenador, quero abrir uma alteração de RH para mudar uma equipe já implantada.

**BDD:** DADO que exista uma versão vigente de RH, QUANDO o coordenador solicitar alteração, ENTAO o sistema deve criar uma versão proposta separada da atual.

**Critérios de Aceitação:**
- CA-F-SD-02-01: A alteração deve partir de uma versão de RH já existente
- CA-F-SD-02-02: O sistema deve permitir registrar motivo e dados alterados
- CA-F-SD-02-03: A versão proposta deve ficar separada da versão atual até homologação

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-04-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-04-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-04-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-05 | Comparar equipe atual e proposta (5 pts)

**Feature:** F-SD-04 - Versões de RH e comparação Atual x Proposta (EP-02)
**Prioridade:** Alta

**Descrição:** Como gestor, quero comparar equipe atual e proposta para entender as mudanças antes da homologação.

**BDD:** DADO que exista uma versão atual e uma proposta, QUANDO o usuário abrir a comparação, ENTAO o sistema deve exibir inclusões, alterações e encerramentos.

**Critérios de Aceitação:**
- CA-F-SD-04-01: O sistema deve listar versões de RH por projeto
- CA-F-SD-04-02: O sistema deve comparar equipe atual e equipe proposta
- CA-F-SD-04-03: As diferenças devem ser exibidas de forma clara para homologação

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-05-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-05-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-05-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

# Sprint 2 - Projetos e Banco de Especialistas

**Objetivo:** Cadastrar projetos, anexos e consultar/vincular especialistas.

**Métricas:** 7 US | 31 Story Points | 56 horas estimadas

---

### US-PR-01 | Cadastrar projeto (5 pts)

**Feature:** F-PR-01 - Cadastro e manutenção de projetos (EP-03)
**Prioridade:** Imediata

**Descrição:** Como gestor do Polo, quero cadastrar projetos para que solicitações de RH sejam vinculadas corretamente.

**BDD:** DADO que o usuário tenha permissão, QUANDO preencher os dados obrigatórios do projeto, ENTAO o sistema deve salvar o projeto ativo.

**Critérios de Aceitação:**
- CA-F-PR-01-01: O projeto deve possuir dados básicos obrigatórios
- CA-F-PR-01-02: O sistema deve permitir consulta, inclusão e alteração de projeto
- CA-F-PR-01-03: Projetos inativos não devem aparecer como opção principal para novas solicitações

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PR-01-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PR-01-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PR-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-02 | Consultar e alterar projeto (3 pts)

**Feature:** F-PR-01 - Cadastro e manutenção de projetos (EP-03)
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero consultar e alterar projetos para manter dados atualizados.

**BDD:** DADO que existam projetos cadastrados, QUANDO o usuário pesquisar e editar um projeto, ENTAO as alterações válidas devem ser persistidas.

**Critérios de Aceitação:**
- CA-F-PR-01-01: O projeto deve possuir dados básicos obrigatórios
- CA-F-PR-01-02: O sistema deve permitir consulta, inclusão e alteração de projeto

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PR-02-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PR-02-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PR-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-03 | Gerenciar anexos múltiplos do projeto (5 pts)

**Feature:** F-PR-02 - Anexos múltiplos do projeto (EP-03)
**Prioridade:** Normal

**Descrição:** Como apoio coordenador, quero anexar documentos do projeto para manter o processo completo.

**BDD:** DADO que o projeto esteja cadastrado, QUANDO o usuário anexar arquivos, ENTAO o sistema deve registrar tipo, data e arquivo para consulta.

**Critérios de Aceitação:**
- CA-F-PR-02-01: O sistema deve permitir múltiplos anexos por projeto
- CA-F-PR-02-02: Cada anexo deve possuir tipo, data e arquivo associado
- CA-F-PR-02-03: A lista de anexos deve permitir consulta posterior

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PR-03-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PR-03-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PR-03-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-BE-01 | Consultar especialista (5 pts)

**Feature:** F-BE-01 - Consulta ao Banco de Especialistas (EP-04)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero consultar o Banco de Especialistas para localizar pesquisadores aptos.

**BDD:** DADO que exista uma base de especialistas disponível, QUANDO pesquisar por nome, matrícula ou perfil, ENTAO o sistema deve listar resultados compatíveis.

**Critérios de Aceitação:**
- CA-F-BE-01-01: A consulta deve permitir buscar especialista por nome, matrícula/identificador ou perfil
- CA-F-BE-01-02: A consulta deve retornar dados mínimos necessários para vinculação
- CA-F-BE-01-03: Ausência de resultado deve gerar mensagem clara ao usuário

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-BE-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-BE-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-BE-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-BE-02 | Vincular pesquisador ao projeto (5 pts)

**Feature:** F-BE-02 - Vinculação de pesquisador ao projeto (EP-04)
**Prioridade:** Alta

**Descrição:** Como coordenador, quero vincular pesquisador ao projeto para montar a equipe de RH.

**BDD:** DADO que o pesquisador foi localizado, QUANDO informar projeto, perfil, origem, fonte e vigência, ENTAO o vínculo deve ser registrado.

**Critérios de Aceitação:**
- CA-F-BE-02-01: A vinculação deve exigir projeto, especialista, perfil, fonte e vigência
- CA-F-BE-02-02: A origem de RH deve ser informada conforme tipos cadastrados
- CA-F-BE-02-03: O sistema deve registrar histórico da vinculação

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-BE-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-BE-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-BE-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-PR-04 | Vincular coordenador/especialista responsável pelo projeto (5 pts)

**Feature:** F-PR-03 - Vinculação de coordenador/especialista ao projeto (EP-03)
**Prioridade:** Alta

**Descrição:** Como gestor do Polo, quero vincular o coordenador/especialista responsável para identificar o responsável pelo projeto.

**BDD:** DADO que o projeto e especialista existam, QUANDO o gestor confirmar a vinculação, ENTAO o projeto deve registrar o responsável vigente.

**Critérios de Aceitação:**
- CA-F-PR-03-01: O coordenador/especialista deve ser localizado no Banco de Especialistas
- CA-F-PR-03-02: A vinculação deve registrar papel e vigência
- CA-F-PR-03-03: O sistema deve impedir vínculo duplicado ativo para a mesma função quando aplicável

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PR-04-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PR-04-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PR-04-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-03 | Evoluir DER e migrações da Sprint 2 (3 pts)

**Feature:** F-AQ-02 - Modelagem do banco de dados e migrações (EP-08)
**Prioridade:** Baixa

**Descrição:** Como equipe técnica, quero evoluir o banco para projetos, anexos e vínculos para suportar as features da Sprint 2.

**BDD:** DADO que a base inicial existe, QUANDO forem aplicadas novas migrações, ENTAO projetos, anexos e vínculos devem ser armazenados corretamente.

**Critérios de Aceitação:**
- CA-F-AQ-02-01: As tabelas principais devem possuir migrações iniciais
- CA-F-AQ-02-02: As relações devem seguir o DER revisado

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-AQ-03-01 [devops/doc] Preparar artefatos técnicos | Marcelo Gomes da Silva | 3 |
| TK-US-AQ-03-02 [doc] Documentar evidências/configuração | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-03-03 [qa] Validar evidências e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Sprint 3 - Monitoramento e Documentos

**Objetivo:** Emitir documentos PDF e consultas/relatórios consolidados.

**Métricas:** 7 US | 31 Story Points | 56 horas estimadas

---

### US-SD-06 | Criar solicitação de pagamento por competência (5 pts)

**Feature:** F-SD-05 - Solicitação de pagamento de RH por mês/ano (EP-02)
**Prioridade:** Alta

**Descrição:** Como coordenador, quero solicitar pagamento de RH por mês e ano para gerar a documentação da competência.

**BDD:** DADO que exista equipe vigente, QUANDO o coordenador informar mês e ano, ENTAO o sistema deve listar membros ativos e valores da competência.

**Critérios de Aceitação:**
- CA-F-SD-05-01: A solicitação de pagamento deve exigir mês e ano de referência
- CA-F-SD-05-02: O sistema deve listar somente membros ativos na competência
- CA-F-SD-05-03: O pagamento deve considerar fonte e carga horária vigente

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-06-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-06-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-06-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-07 | Gerar PDF de implantação inicial (5 pts)

**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados (EP-02)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero gerar PDF de implantação inicial para anexar ao processo administrativo.

**BDD:** DADO que a implantação inicial esteja válida, QUANDO o usuário acionar a emissão, ENTAO o PDF deve ser gerado no padrão definido.

**Critérios de Aceitação:**
- CA-F-SD-06-01: O sistema deve gerar PDF de implantação inicial

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-07-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-07-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-07-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-08 | Gerar PDF de alteração de RH (5 pts)

**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados (EP-02)
**Prioridade:** Imediata

**Descrição:** Como coordenador, quero gerar PDF de alteração de RH com estado atual e proposto para formalizar mudanças.

**BDD:** DADO que exista alteração de RH validada, QUANDO o usuário emitir o documento, ENTAO o PDF deve apresentar as informações antes e depois.

**Critérios de Aceitação:**
- CA-F-SD-06-02: O sistema deve gerar PDF de alteração de RH
- CA-F-SD-04-02: O sistema deve comparar equipe atual e equipe proposta
- CA-F-SD-04-03: As diferenças devem ser exibidas de forma clara para homologação

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-08-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-SD-08-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-SD-08-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-SD-09 | Gerar PDF de folha/solicitação de pagamento (5 pts)

**Feature:** F-SD-06 - Geração automatizada de PDFs padronizados (EP-02)
**Prioridade:** Alta

**Descrição:** Como coordenador, quero gerar PDF de folha de pagamento para a competência selecionada.

**BDD:** DADO que a solicitação de pagamento foi calculada, QUANDO o usuário emitir o documento, ENTAO o PDF deve listar membros, fonte, horas e valores.

**Critérios de Aceitação:**
- CA-F-SD-06-03: O sistema deve gerar PDF de folha/solicitação de pagamento
- CA-F-SD-05-01: A solicitação de pagamento deve exigir mês e ano de referência
- CA-F-SD-05-02: O sistema deve listar somente membros ativos na competência

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-SD-09-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-SD-09-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-SD-09-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-MO-01 | Consultar alocação por projeto, fonte e perfil (5 pts)

**Feature:** F-MO-01 - Consulta e relatório de alocação por projeto, fonte e perfil (EP-05)
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero consultar alocação por projeto, fonte e perfil para acompanhar a composição das equipes.

**BDD:** DADO que existam vínculos cadastrados, QUANDO aplicar filtros de projeto, fonte ou perfil, ENTAO o relatório deve exibir os dados vigentes.

**Critérios de Aceitação:**
- CA-F-MO-01-01: O relatório deve permitir filtrar por projeto, fonte e perfil
- CA-F-MO-01-02: O relatório deve permitir exportar/visualizar dados consolidados
- CA-F-MO-01-03: Os dados devem refletir a versão vigente de RH

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-MO-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-MO-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-MO-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-MO-02 | Visualizar consolidação por fonte (3 pts)

**Feature:** F-MO-02 - Visão consolidada por fonte de financiamento (EP-05)
**Prioridade:** Normal

**Descrição:** Como gestor do Polo, quero visualizar a distribuição por fonte de financiamento para acompanhar EMBRAPII, EMPRESA, SEBRAE e IFPB.

**BDD:** DADO que existam vínculos com fontes cadastradas, QUANDO abrir a visão consolidada, ENTAO o sistema deve apresentar totais separados por fonte.

**Critérios de Aceitação:**
- CA-F-MO-02-01: A visão deve separar fontes EMBRAPII, EMPRESA, SEBRAE e IFPB
- CA-F-MO-02-02: O sistema deve apresentar totais por fonte
- CA-F-MO-02-03: A consulta deve considerar apenas vínculos ativos ou vigentes no filtro

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-MO-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-MO-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-MO-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-04 | Registrar evidências de testes da Sprint 3 (3 pts)

**Feature:** F-AQ-03 - Qualidade, evidências e apoio ao OpenProject (EP-08)
**Prioridade:** Baixa

**Descrição:** Como QA, quero registrar evidências de testes para comprovar a execução das US da sprint.

**BDD:** DADO que as US estejam implementadas, QUANDO os testes forem realizados, ENTAO as evidências devem ser organizadas para entrega.

**Critérios de Aceitação:**
- CA-F-AQ-03-01: Cada US deve possuir evidência de teste ou validação
- CA-F-AQ-03-03: O PDF de evidências deve comprovar critérios, BDD, tasks, horas e responsáveis

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-AQ-04-01 [devops/doc] Preparar artefatos técnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-04-02 [doc] Documentar evidências/configuração | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-04-03 [qa] Validar evidências e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Sprint 4 - Transferência e Parametrização

**Objetivo:** Finalizar transferências, parametrização e homologação integrada.

**Métricas:** 6 US | 24 Story Points | 48 horas estimadas

---

### US-TR-01 | Solicitar transferência de pesquisador (5 pts)

**Feature:** F-TR-01 - Solicitação de transferência de RH (EP-06)
**Prioridade:** Imediata

**Descrição:** Como coordenador solicitante, quero pedir transferência de pesquisador entre projetos para reaproveitar especialistas.

**BDD:** DADO que exista pesquisador vinculado em projeto origem, QUANDO informar projeto destino e justificativa, ENTAO o sistema deve criar pendência de aceite.

**Critérios de Aceitação:**
- CA-F-TR-01-01: A transferência deve indicar projeto origem, projeto destino e pesquisador
- CA-F-TR-01-02: A transferência deve gerar pendência para o coordenador cedente
- CA-F-TR-01-03: A solicitação deve manter status de acompanhamento

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-TR-01-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-TR-01-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-TR-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-TR-02 | Aceitar ou recusar transferência (5 pts)

**Feature:** F-TR-02 - Aceite ou recusa pelo coordenador cedente (EP-06)
**Prioridade:** Imediata

**Descrição:** Como coordenador cedente, quero aceitar ou recusar transferência para controlar saída de pesquisador do meu projeto.

**BDD:** DADO que exista uma pendência de transferência, QUANDO o coordenador cedente aceitar ou recusar, ENTAO o sistema deve atualizar o status e registrar a decisão.

**Critérios de Aceitação:**
- CA-F-TR-02-01: O coordenador cedente deve conseguir aceitar ou recusar a transferência
- CA-F-TR-02-02: A recusa deve exigir justificativa
- CA-F-TR-02-03: O aceite deve liberar a transferência para continuidade/homologação

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-TR-02-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-TR-02-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-TR-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-TR-03 | Consultar histórico de transferências (3 pts)

**Feature:** F-TR-03 - Histórico de transferências (EP-06)
**Prioridade:** Baixa

**Descrição:** Como gestor do Polo, quero consultar histórico de transferências para manter rastreabilidade administrativa.

**BDD:** DADO que existam transferências registradas, QUANDO aplicar filtros de status/projeto, ENTAO o sistema deve exibir histórico com datas e responsáveis.

**Critérios de Aceitação:**
- CA-F-TR-03-01: O sistema deve listar transferências por status
- CA-F-TR-03-02: O histórico deve preservar datas, responsáveis e justificativas
- CA-F-TR-03-03: A consulta deve permitir rastrear a solicitação associada

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-TR-03-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-TR-03-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-TR-03-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-PA-01 | Cadastrar regra de carga horária e bolsa com vigência (5 pts)

**Feature:** F-PA-01 - Parametrização de carga horária, bolsas e vigência (EP-07)
**Prioridade:** Alta

**Descrição:** Como administrador, quero cadastrar regras com vigência para controlar cálculos sem alterar código.

**BDD:** DADO que o administrador esteja no módulo de parametrização, QUANDO informar valores, limites e vigência, ENTAO a regra deve ser salva e validada.

**Critérios de Aceitação:**
- CA-F-PA-01-01: O administrador deve cadastrar regras com vigência
- CA-F-PA-01-02: Alterações novas não devem corromper cálculos históricos
- CA-F-PA-01-03: Valores e limites devem ser validados antes de salvar

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PA-01-01 [back] Implementar regras/endpoint | Vinicius Lopes de Alencar | 3 |
| TK-US-PA-01-02 [front] Implementar tela/componente | Lindomar da Silva Junior | 3 |
| TK-US-PA-01-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-PA-02 | Cadastrar tipos de solicitação/origem de RH (3 pts)

**Feature:** F-PA-02 - Parametrização de tipos de solicitação/origem de RH (EP-07)
**Prioridade:** Normal

**Descrição:** Como administrador, quero manter tipos de solicitação/origem de RH (pesquisador prospector, processo seletivo e transferência entre projetos) para padronizar os fluxos do sistema.

**BDD:** DADO que o administrador tenha permissão, QUANDO cadastrar ou inativar um tipo, ENTAO o sistema deve refletir a mudança nos formulários.

**Critérios de Aceitação:**
- CA-F-PA-02-01: O administrador deve manter tipos de solicitação/origem de RH
- CA-F-PA-02-02: Tipos inativos não devem aparecer em novos cadastros
- CA-F-PA-02-03: O sistema deve manter histórico de alterações de parametrização

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-PA-02-01 [back] Implementar regras/endpoint | Marcelo Gomes da Silva | 3 |
| TK-US-PA-02-02 [front] Implementar tela/componente | Lucas Matheus Santos da Silva | 3 |
| TK-US-PA-02-03 [qa] Testar BDD e critérios associados | Carolina Araujo de Sousa | 2 |

---

### US-AQ-05 | Consolidar bugs, melhorias e evidências finais (3 pts)

**Feature:** F-AQ-03 - Qualidade, evidências e apoio ao OpenProject (EP-08)
**Prioridade:** Baixa

**Descrição:** Como equipe, quero consolidar evidências finais e registrar bugs/melhorias para demonstrar rastreabilidade da entrega.

**BDD:** DADO que as sprints foram executadas, QUANDO finalizar a entrega, ENTAO o OpenProject deve conter evidências, bugs/melhorias e registros atualizados.

**Critérios de Aceitação:**
- CA-F-AQ-03-01: Cada US deve possuir evidência de teste ou validação
- CA-F-AQ-03-02: Bugs e melhorias devem ser registrados na versão correta
- CA-F-AQ-03-03: O PDF de evidências deve comprovar critérios, BDD, tasks, horas e responsáveis

| Task | Responsável | Horas |
|------|-------------|-------|
| TK-US-AQ-05-01 [devops/doc] Preparar artefatos técnicos | Vinicius Lopes de Alencar | 3 |
| TK-US-AQ-05-02 [doc] Documentar evidências/configuração | Erick Victor Carvalho de Araujo | 3 |
| TK-US-AQ-05-03 [qa] Validar evidências e rastreabilidade | Carolina Araujo de Sousa | 2 |

---

# Versão de Bugs/Melhorias

**BUGS/MELHORIAS - Banco de Especialistas** (Kanban)

Versão específica para registrar bugs e melhorias após homologações e testes. Não misturar com novas US.
