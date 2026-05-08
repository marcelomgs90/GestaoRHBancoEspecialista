# Modelo de Dados

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

Armazena dados dos usuarios do sistema e seus perfis de acesso.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_usuario | INT (PK) | Identificador unico |
| id | INT | Identificador secundario |
| nome_completo | VARCHAR(100) | Nome do usuario |
| email | VARCHAR(100) | E-mail de acesso |
| senha_hash | VARCHAR(255) | Hash da senha |
| status | TINYINT | Ativo/Inativo |
| data_criacao | DATE | Data de criacao do registro |

**Relacionamentos:**
- `(1:N)` com **Projeto** via `Projeto.coordenador_id`
- `(1:N)` com **Transferencia_RH** via `Transferencia_RH.coordenador_cedente_id`

---

## Tabela: Parametro_Regra

Armazena regras de carga horaria e categorias de bolsa com controle de vigencia temporal.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_parametro | INT (PK) | Identificador unico |
| tipo_regra | VARCHAR(50) | Tipo da regra parametrizada |
| valor_bolsa | DECIMAL(10,2) | Valor monetario da bolsa |
| limite_semanal | INT | Horas semanais maximas |
| limite_mensal | INT | Horas mensais maximas |
| vigencia_inicio | DATE | Data de inicio da vigencia |
| vigencia_fim | DATE | Data de fim da vigencia |
| status | TINYINT | Ativo/Inativo |

**Relacionamentos:**
- `(1:N)` com **Pesquisador_Projeto** (referencia a regra aplicada ao vinculo)

**Regra importante:** Alteracoes nos valores de bolsa NAO devem ser retroativas. O sistema deve manter historico de vigencia para que recalculos futuros nao corrompam o historico financeiro de projetos passados.

---

## Tabela: Projeto

Armazena os dados cadastrais do projeto.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_projeto | INT (PK) | Identificador unico |
| coordenador_id | INT (FK) | FK para Usuario_Perfil |
| titulo | VARCHAR(255) | Nome do projeto |
| status | VARCHAR(50) | Status atual do projeto |
| data_inicio | DATE | Inicio do projeto |
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

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_anexo | INT (PK) | Identificador unico |
| projeto_id | INT (FK) | FK para Projeto |
| tipo_documento | VARCHAR(50) | Plano de Trabalho, Acordo de Parceria, etc. |
| numero_documento | VARCHAR(45) | Numero/identificador oficial |
| caminho_arquivo | VARCHAR(255) | Localizacao no storage |
| data_upload | DATE | Data do envio |

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`

---

## Tabela: Pesquisador_Projeto

Registra a participacao (vinculo) de pesquisadores nos projetos. Permite que o mesmo pesquisador atue mais de uma vez no mesmo projeto em periodos distintos, sem perda de historico.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_vinculacao | INT (PK) | Identificador unico |
| projeto_id | INT (FK) | FK para Projeto |
| pesquisador_id | INT (FK) | FK para Pesquisador (AIE) |
| fonte_financiamento | VARCHAR(20) | EMBRAPII, EMPRESA, SEBRAE, IFPB |
| carga_horaria_semanal | INT | Horas por semana |
| valor_bolsa | DECIMAL(10,2) | Valor calculado da bolsa |
| categoria_bolsa | VARCHAR(50) | Referencia a categoria de Parametro_Regra |
| data_inicio | DATE | Inicio da participacao |
| data_fim | DATE | Fim da participacao |
| versao_rh_id | INT (FK) | FK para Versao_RH_Projeto |

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`
- `(N:1)` com **Pesquisador (AIE)** via `pesquisador_id`
- `(N:1)` com **Versao_RH_Projeto** via `versao_rh_id`
- `(N:1)` com **Parametro_Regra** (regra aplicada ao calculo)

---

## Tabela: Solicitacao_RH

Controla as solicitacoes de implantacao, alteracao e pagamento de RH.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_solicitacao | INT (PK) | Identificador unico |
| projeto_id | INT (FK) | FK para Projeto |
| tipo_solicitacao | VARCHAR(50) | Implantacao, Alteracao, Pagamento |
| numero_documento | VARCHAR(45) | Numero para controle interno e PDFs |
| mes_ano | VARCHAR | Mes/ano de referencia (para pagamento) |
| status | VARCHAR(30) | Status corrente da solicitacao |
| data_abertura | DATE | Data de criacao |

**Relacionamentos:**
- `(N:1)` com **Projeto** via `projeto_id`
- `(1:N)` com **Versao_RH_Projeto** via `Versao_RH_Projeto.solicitacao_id`

---

## Tabela: Versao_RH_Projeto

Registra as versoes de composicao de equipe de RH geradas a partir das solicitacoes. Cada solicitacao pode gerar versoes "Antes" e "Depois" para comparacao.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_versao_rh | INT (PK) | Identificador unico |
| solicitacao_id | INT (FK) | FK para Solicitacao_RH |
| projeto_id | INT (FK) | FK para Projeto |
| numero_versao | INT | Sequencial da versao |
| status | VARCHAR(25) | Status da versao |
| data_versao | DATE | Data de criacao da versao |

**Relacionamentos:**
- `(N:1)` com **Solicitacao_RH** via `solicitacao_id`
- `(N:1)` com **Projeto** via `projeto_id`
- `(1:N)` com **Pesquisador_Projeto** via `Pesquisador_Projeto.versao_rh_id`

**Nota:** A versao de RH permite controlar as diferentes composicoes de equipe ao longo do projeto, viabilizando a comparacao Antes vs. Depois nas solicitacoes de alteracao.

---

## Tabela: Transferencia_RH

Controla o fluxo de transferencia de pesquisadores entre projetos, incluindo o aceite do coordenador cedente.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_transferencia | INT (PK) | Identificador unico |
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

Dados mantidos pelo sistema externo "Banco de Especialistas". O sistema Gestao RH apenas consulta.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ref_pesquisador | INT (PK) | Identificador unico no sistema externo |
| nome | VARCHAR(100) | Nome completo |
| tipo_vinculo | VARCHAR(50) | Servidor, Estudante, Colaborador Externo |
| area_especialidade | VARCHAR(100) | Area de atuacao |
| instituicao | VARCHAR(100) | Instituicao de origem |
| situacao | VARCHAR(30) | Ativo/Inativo |

**Nota:** Os dados do pesquisador NAO sao mantidos pela aplicacao Gestao RH. O relacionamento Pesquisador-Projeto e mantido internamente na tabela Pesquisador_Projeto.
