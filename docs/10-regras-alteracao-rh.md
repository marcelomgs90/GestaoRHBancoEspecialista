# Regras de Alteração de RH

Este documento descreve as regras de negócio para o fluxo de alteração de membros em projetos de RH.

## 1. Fluxo de Vida de Solicitações

### 1.1 Estados da Solicitação

| Status | Descrição | Versão Exibida | is_rascunho |
|--------|----------|---------------|-------------|
| EM_EDICAO | Rascunho em edição | PROPOSTA | true |
| SUBMETIDA | Pendente de aprovação | PROPOSTA | false |
| APROVADA | Aprovada pelo Gestor | VIGENTE | false |
| REJEITADA | Rejeitada pelo Gestor | VIGENTE | false |

> Mudanças só passam a valer para a equipe oficial do projeto **após aprovação**.
> Em `SUBMETIDA` a equipe oficial (VIGENTE) permanece inalterada — as inclusões/alterações/
> remoções da `PROPOSTA` só são aplicadas quando o Gestor do Polo aprova.

### 1.2 Transições de Estado

```
EM_EDICAO --(submeter)--> SUBMETIDA --(aprovar)--> APROVADA --> Adiciona/Remove o membro no projeto
                         \
                          +--(rejeitar)--> REJEITADA
```

## 2. Versões de RH

### 2.1 Estados da Versão

| Status | Descrição |
|--------|-----------|
| PROPOSTA | Versão em edição (rascunho) |
| VIGENTE | Versão oficial do projeto |
| HISTORICO | Versão anterior arquivada |

### 2.2 Comportamento por Status de Solicitação

| Status Solicitação | Versão Retornada | Comportamento |
|------------------|------------------|---------------|
| EM_EDICAO | PROPOSTA | Exibe membros em edição (rascunho) |
| SUBMETIDA | PROPOSTA | Exibe as alterações pendentes (equipe oficial preservada) |
| APROVADA | VIGENTE | Exibe a equipe oficial vigente |
| REJEITADA | VIGENTE | Exibe a equipe oficial anterior (a VIGENTE nunca foi alterada) |

## 3. Operações com Membros

### 3.1 Endpoints

| Operação | Método | Endpoint | Validações |
|----------|--------|----------|-----------|
| Incluir | POST | `/solicitacoes/{id}/membros` | Apenas EM_EDICAO + perfil autorizado a editar RH |
| Listar | GET | `/solicitacoes/{id}/membros` | - |
| Atualizar | PUT | `/solicitacoes/{id}/membros/{membro_id}` | Apenas EM_EDICAO + perfil autorizado a editar RH |
| Remover | DELETE | `/solicitacoes/{id}/membros/{membro_id}` | Apenas EM_EDICAO + perfil autorizado a editar RH |

### 3.2 Listagem no Projeto

O endpoint `GET /projetos/{id}/pesquisadores` retorna os pesquisadores da versão
**oficialmente vigente** do projeto (apenas o que foi aprovado):

- Se há solicitação `EM_EDICAO` ou `SUBMETIDA` → retorna a `PROPOSTA` (rascunho)
  - em `EM_EDICAO`: `is_rascunho=True` (editável)
  - em `SUBMETIDA`: `is_rascunho=False` (pendente, equipe oficial intacta)
- Caso contrário → retorna a `VIGENTE` atual
  - cobre `APROVADA` e `REJEITADA` (a `VIGENTE` original nunca foi alterada no submit)

**Importante:** a equipe oficial só muda quando uma solicitação é **aprovada**.

## 4. Fluxos de Alteração

### 4.1 Criação de Membro (Implantação)

```
1. Coordenador cria solicitação IMPLANTAÇÃO
2. Sistema cria Solicitacao EM_EDICAO + VersaoRHProjeto PROPOSTA
3. Coordenador inclui membros
4. Coordenador submete
   - Status: EM_EDICAO → SUBMETIDA
   - Versão permanece PROPOSTA (equipe oficial ainda vazia)
5. Gestor aprova
   - Status: SUBMETIDA → APROVADA
   - Versão: PROPOSTA → VIGENTE
6. Membros aparecem no projeto
```

### 4.2 Edição de Membro (Alteração)

```
1. Coordenador cria solicitação ALTERAÇÃO
2. Sistema cria Solicitacao EM_EDICAO + VersaoRHProjeto PROPOSTA (clonada da VIGENTE)
3. Coordenador atualiza dados do membro
4. Coordenador submete
   - Status: EM_EDICAO → SUBMETIDA
   - Versão atual (PROPOSTA) permanece PROPOSTA
   - VIGENTE anterior permanece VIGENTE (equipe oficial intacta)
5. Gestor aprova
   - Status: SUBMETIDA → APROVADA
   - Versão anterior: VIGENTE → HISTORICO
   - Nova versão: PROPOSTA → VIGENTE
6. Dados atualizados aparecem no projeto
```

### 4.3 Remoção de Membro (Alteração)

```
1. Coordenador cria solicitação ALTERAÇÃO
2. Sistema cria Solicitacao EM_EDICAO + VersaoRHProjeto PROPOSTA (clonada da VIGENTE)
3. Coordenador remove membro
   - Membro deletado fisicamente da PROPOSTA
4. Coordenador submete
   - Status: EM_EDICAO → SUBMETIDA
   - VIGENTE anterior permanece VIGENTE (membro ainda visível)
5. Gestor aprova
   - Status: SUBMETIDA → APROVADA
   - Versão anterior: VIGENTE → HISTORICO
   - Nova versão: PROPOSTA → VIGENTE (sem o membro)
6. Membro NÃO aparece no projeto
```

### 4.4 Rejeição de Alteração

```
1. Coordenador cria alteração com membro
2. Coordenador submete (PROPOSTA preservada; VIGENTE original intacta)
3. Gestor rejeita
   - Status: SUBMETIDA → REJEITADA
   - VIGENTE original se mantém (não há o que reverter — nunca foi alterada)
4. Equipe do projeto permanece como antes (membro NÃO aparece, pois a VIGENTE nunca perdeu ele)
```

## 5. Regras de Permissão

| Ação | Coordenador | Gestor Polo | Administrador | Apoio Coordenador |
|------|------------|-------------|---------------|-------------------|
| Criar projeto | ✓ | ✓ | ✓ | - |
| Editar projeto | Próprios | ✓ | ✓ | - |
| Listar projetos | Próprios | Todos | Todos | Todos |
| Criar implantação/alteração de RH | Próprios | - | ✓ | ✓ |
| Criar/editar/remover membro | Próprios | - | ✓ | ✓ |
| Submeter solicitação | Próprios | - | ✓ | ✓ |
| Listar/visualizar solicitações | Próprias | ✓ | ✓ | ✓ |
| Aprovar solicitação | - | ✓ | ✓ | - |
| Rejeitar solicitação | - | ✓ | ✓ | - |

## 6. Validações

### 6.1 Inclusão de Membro

- Soliciteção deve estar em EM_EDICAO
- Usuário deve ser coordenador do projeto, administrador ou apoio coordenador
- Valor da bolsa calculado automaticamente via Parametro_Regra
- Validação de carga horária global

### 6.2 Atualização de Membro

- Soliciteção deve estar em EM_EDICAO
- Usuário deve ser coordenador do projeto, administrador ou apoio coordenador

### 6.3 Remoção de Membro

- Soliciteção deve estar em EM_EDICAO
- Usuário deve ser coordenador do projeto, administrador ou apoio coordenador
- Deleção física (não retorna na lista)

### 6.4 Aprovação

- Usuário deve ser GESTOR_POLO ou ADMINISTRADOR
- Solicitação deve estar em SUBMETIDA

### 6.5 Rejeição

- Usuário deve ser GESTOR_POLO ou ADMINISTRADOR
- Solicitação deve estar em SUBMETIDA
- Justificativa opcional

## 7. Justificativa de Rejeição

Quando uma solicitação é rejeitada, o campo `justificativa` da SolicitacaoRH é preenchido.

Este campo é exibido na tela de comparação quando presente:
- Localização: Abaixo do header, acima dos botões de ação
- Estilo: Caixa vermelha com texto da justificativa

## 8.API Reference

### 8.1 Endpoints de Solicitação

```
POST   /solicitacoes/implantacao          - Criar implantação
POST   /solicitacoes/               - Criar alteração
GET    /solicitacoes/               - Listar solicitações
GET    /solicitacoes/{id}            - Obter solicitação
POST   /solicitacoes/{id}/submeter    - Submeter
POST   /solicitacoes/{id}/aprovar    - Aprovar
POST   /solicitacoes/{id}/rejeitar   - Rejeitar
GET    /solicitacoes/{id}/comparacao - Comparar versões
```

### 8.2 Endpoints de Membros

```
POST   /solicitacoes/{id}/membros           - Incluir membro
GET    /solicitacoes/{id}/membros           - Listar membros
PUT    /solicitacoes/{id}/membros/{membro_id} - Atualizar membro
DELETE /solicitacoes/{id}/membros/{membro_id} - Remover membro
```

### 8.3 Endpoints de Projeto

```
GET /projetos/{id}/pesquisadores - Listar pesquisadores (versão corrente)
```
