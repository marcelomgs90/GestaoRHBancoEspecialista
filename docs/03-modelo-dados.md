# Modelo de Dados

> **Nota de implementação:** Este documento usa os nomes de PK do DER original (`ref_usuario`, `ref_projeto`, `ref_parametro`, etc.). Na implementação SQLAlchemy, todos os modelos usam `id` como nome da coluna de chave primária (padrão do framework). Os campos representam o mesmo conceito — apenas o nome difere entre spec e código.

## Diagrama de Relacionamentos

```
Usuario_Perfil
    |
    | coordenador_id (1:N)
    v
Projeto -----(1:N)----> Projeto_Anexo
    |
    |--- (1:N) ---> Pesquisador_Projeto <--- (N:1) --- Pesquisador (AIE)
    |                       |                               
    |                       |--- (N:1) --- Versao_RH_Projeto
    |                       |--- (N:1) --- Parametro_Regra
    |                       
    |--- (1:N) ---> Solicitacao_RH
    |                   |
    |                   |--- (1:N) ---> Versao_RH_Projeto
    |
    |--- (N:1 origem) ---> Transferencia_RH <--- (N:1 destino) --- Projeto
            Pesquisador (AIE) ---|  (N:1)
            Usuario_Perfil -----|  (N:1) coordenador_cedente_id
```

---

## Tabela: Usuario_Perfil

Armazena dados dos usuários do sistema e seus perfis de acesso.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_usuario | INT (PK) | Identificador único |
| id | INT | Identificador secundário |
| nome_completo | VARCHAR(100) | Nome do usuário |
| email | VARCHAR(100) | E-mail de acesso |
| senha_hash | VARCHAR(255) | Hash da senha |
| status | TINYINT | Ativo/Inativo |
| data_criacao | DATE | Data de criação do registro |

**Relacionamentos:**
- `(1:N)` com **Projeto** via `Projeto.coordenador_id`
- `(1:N)` com **Transferencia_RH** via `Transferencia_RH.coordenador_cedente_id`

---

## Tabela: Parametro_Regra

Armazena regras de carga horária e categorias de bolsa com controle de vigência temporal.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_parametro | INT (PK) | Identificador único |
| tipo_regra | VARCHAR(50) | Tipo da regra parametrizada |
| valor_bolsa | DECIMAL(10,2) | Valor monetário da bolsa |
| limite_semanal | INT | Horas semanais máximas |
| limite_mensal | INT | Horas mensais máximas |
| vigencia_inicio | DATE | Data de início da vigência |
| vigencia_fim | DATE | Data de fim da vigência |
| status | TINYINT | Ativo/Inativo |

**Relacionamentos:**
- `(1:N)` com **Pesquisador_Projeto** (referência a regra aplicada ao vínculo)

**Regra importante:** Alterações nos valores de bolsa NÃO devem ser retroativas. O sistema deve manter histórico de vigência para que recálculos futuros não corrompam o histórico financeiro de projetos passados.

---

## Tabela: Projeto

Armazena os dados cadastrais do projeto.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_projeto | INT (PK) | Identificador único |
| coordenador_id | INT (FK) | FK para Usuario_Perfil |
| codigo | VARCHAR(50) | Código manual do projeto; opcional e único quando informado |
| sigla | VARCHAR(20) | Sigla obrigatória do projeto; alfanumérica, mínimo 5 e máximo 20 caracteres |
| titulo | VARCHAR(255) | Nome do projeto |
| status | VARCHAR(50) | Status atual do projeto |
| data_inicio | DATE | Início do projeto |
| data_fim | DATE | Fim previsto/real |

**Relacionamentos:**
- `(N:1)` com **Usuario_Perfil** via `coordenador_id`
- `(1:N)` com **Projeto_Anexo** via `Projeto_Anexo.projeto_id`
- `(1:N)` com **Pesquisador_Projeto** via `Pesquisador_Projeto.projeto_id`
- `(1:N)` com **Solicitacao_RH** via `Solicitacao_RH.projeto_id`
- `(1:N)` com **Transferencia_RH** via `projeto_origem_id` e `projeto_destino_id`

---

## Tabela: Projeto_Anexo

Armazena os documentos anexados a um projeto (Plano de Trabalho, Acordo de Parceria, extrato DO, aditivos, etc.).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_anexo | INT (PK) | Identificador único |
| projeto_id | INT (FK) | FK para Projeto |
| tipo_documento | VARCHAR(50) | Plano de Trabalho, Acordo de Parceria, etc. |
| numero_documento | VARCHAR(45) | Número/identificador oficial |
| caminho_arquivo | VARCHAR(255) | Localização no storage |
| data_upload | DATE | Data do envio |

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`

---

## Tabela: Pesquisador_Projeto

Registra a participação (vínculo) de pesquisadores nos projetos. Permite que o mesmo pesquisador atue mais de uma vez no mesmo projeto em períodos distintos, sem perda de histórico.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_vinculacao | INT (PK) | Identificador único |
| projeto_id | INT (FK) | FK para Projeto |
| pesquisador_id | INT (FK) | FK para Pesquisador (AIE) |
| fonte_financiamento | VARCHAR(20) | EMBRAPII, EMPRESA, SEBRAE |
| carga_horaria_semanal | INT | Horas por semana |
| valor_bolsa | DECIMAL(10,2) | Valor calculado da bolsa |
| categoria_bolsa | VARCHAR(50) | Referência à categoria de Parametro_Regra |
| data_inicio | DATE | Início da participação |
| data_fim | DATE | Fim da participação |
| versao_rh_id | INT (FK) | FK para Versao_RH_Projeto |

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`
- `(N:1)` com **Pesquisador (AIE)** via `pesquisador_id`
- `(N:1)` com **Versao_RH_Projeto** via `versao_rh_id`
- `(N:1)` com **Parametro_Regra** (regra aplicada ao cálculo)

---

## Tabela: Solicitacao_RH

Controla as solicitações de implantação, alteração e pagamento de RH.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_solicitacao | INT (PK) | Identificador único |
| projeto_id | INT (FK) | FK para Projeto |
| tipo | ENUM | `IMPLANTACAO`, `ALTERACAO`, `PAGAMENTO` |
| identificador | VARCHAR(50) | Número manual para controle interno e PDFs (`numero_documento` na spec) |
| mes_ano_referencia | VARCHAR(7) | Formato `YYYY-MM` (usado em pagamento) |
| justificativa | TEXT | Texto livre do coordenador |
| status | ENUM | `EM_EDICAO`, `SUBMETIDA`, `APROVADA`, `REJEITADA` |
| criado_por | INT (FK) | FK para Usuario_Perfil (autor) |
| data_abertura | DATE | Data de criação |

**Enum `TipoSolicitacao`:**
- `IMPLANTACAO` — primeira versão de RH do projeto
- `ALTERACAO` — modificação da equipe vigente
- `PAGAMENTO` — folha de um mês/ano específico

**Enum `StatusSolicitacao`:**
- `EM_EDICAO` — rascunho editável; no máximo um por tipo/projeto
- `SUBMETIDA` — coordenador finalizou; aguardando parecer do Gestor do Polo. A versão associada permanece `PROPOSTA` (equipe oficial intacta).
- `APROVADA` — Gestor do Polo aprovou; a versão `PROPOSTA` passa a `VIGENTE` e a equipe oficial do projeto é atualizada
- `REJEITADA` — Gestor do Polo rejeitou; a `VIGENTE` original (que nunca foi alterada) permanece como equipe oficial

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`
- `(N:1)` com **Usuario_Perfil** via `criado_por`
- `(1:1)` com **Versao_RH_Projeto** via `Versao_RH_Projeto.solicitacao_id` (cada solicitação gera exatamente uma versão)

---

## Tabela: Versao_RH_Projeto

Registra as versões de composição de equipe de RH geradas a partir das solicitações. Cada solicitação gera exatamente uma versão; a comparação Antes/Depois é feita entre versões sequenciais do mesmo projeto.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_versao_rh | INT (PK) | Identificador único |
| solicitacao_id | INT (FK) | FK para Solicitacao_RH (1:1) |
| projeto_id | INT (FK) | FK para Projeto |
| numero_versao | INT | Sequencial da versão no projeto (1, 2, 3...) |
| status | ENUM | `PROPOSTA`, `VIGENTE`, `HISTORICO` |
| criado_em | DATETIME | Data/hora de criação |

**Enum `StatusVersaoRH`:**
- `PROPOSTA` — rascunho em edição, ainda não oficializado
- `VIGENTE` — versão oficial atual; uma única por projeto
- `HISTORICO` — versão anteriormente vigente, mantida para auditoria

**Transições de estado (a transição da versão ocorre na aprovação, não no submit):**

```
PROPOSTA --(aprovar implantacao)--> VIGENTE
PROPOSTA --(aprovar alteracao)----> VIGENTE    (versao VIGENTE anterior vai para HISTORICO)
```

> `submeter()` apenas move a solicitação para `SUBMETIDA` sem alterar o status da versão
> nem da `VIGENTE` anterior. Assim, a equipe oficial do projeto só muda após aprovação.

**Relacionamentos:**
- `(1:1)` com **Solicitacao_RH** via `solicitacao_id`
- `(N:1)` com **Projeto** via `projeto_id`
- `(1:N)` com **Pesquisador_Projeto** via `Pesquisador_Projeto.versao_rh_id`

**Nota:** Ao criar uma `ALTERACAO`, o backend clona automaticamente os membros da versão `VIGENTE` para a nova `PROPOSTA`, servindo como base editável para o coordenador.

---

## Tabela: Transferencia_RH

Controla o fluxo de transferência de pesquisadores entre projetos, incluindo o aceite do coordenador cedente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_transferencia | INT (PK) | Identificador único |
| pesquisador_id | INT (FK) | FK para Pesquisador (AIE) |
| projeto_origem_id | INT (FK) | FK para Projeto (cedente) |
| projeto_destino_id | INT (FK) | FK para Projeto (receptor) |
| coordenador_cedente_id | INT (FK) | FK para Usuario_Perfil |

**Relacionamentos:**
- `(N:1)` com **Pesquisador (AIE)** via `pesquisador_id`
- `(N:1)` com **Projeto** via `projeto_origem_id` (projeto cedente)
- `(N:1)` com **Projeto** via `projeto_destino_id` (projeto receptor)
- `(N:1)` com **Usuario_Perfil** via `coordenador_cedente_id`

---

## Entidade Externa: Pesquisador (AIE)

Dados mantidos pelo sistema externo "Banco de Especialistas". O sistema Gestão RH apenas consulta.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ref_pesquisador | INT (PK) | Identificador único no sistema externo |
| nome | VARCHAR(100) | Nome completo |
| tipo_vinculo | VARCHAR(50) | Servidor, Estudante, Colaborador Externo |
| area_especialidade | VARCHAR(100) | Área de atuação |
| instituicao | VARCHAR(100) | Instituição de origem |
| situacao | VARCHAR(30) | Ativo/Inativo |

**Nota:** Os dados do pesquisador NÃO são mantidos pela aplicação Gestão RH. O relacionamento Pesquisador-Projeto é mantido internamente na tabela Pesquisador_Projeto.

**Mapeamento no Gestão RH:** o tipo de pesquisador é obtido via INNER JOIN entre `public.users.specialist_type_id` e `public.users_specialist_types.id` (mapeado em `backend/app/models/especialista_externo.py` como `UsersSpecialistType`). O endpoint `GET /especialistas/pesquisadores/` aplica `ILIKE` sobre `users_specialist_types.name` quando o filtro `tipo` é informado. Usuários sem `specialist_type_id` populado são excluídos da resposta (INNER JOIN).
