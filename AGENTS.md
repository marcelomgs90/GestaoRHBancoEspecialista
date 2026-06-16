# AGENTS.md

Este arquivo fornece orientações a agentes de IA (Claude Code, Cursor, Copilot, Codex, Gemini etc.) para trabalhar com o código deste repositório.

## Visão Geral do Projeto

**Gestão RH Banco de Especialistas** - Aplicação web para gestão de equipes de projetos de PD&I e Recursos Humanos do Polo de Inovação do IFPB. O sistema aplica as regras da Resolução 11/2022 para cálculos de bolsas, limites de carga horária e gera documentos PDF padronizados para submissão no SUAP.

Conceitos-chave do domínio:
- Coordenadores alocam pesquisadores em projetos com fontes de financiamento específicas (EMBRAPII, EMPRESA, SEBRAE)
- Valores de bolsas são calculados automaticamente com base na categoria, horas semanais e tabelas de parâmetros com vigência temporal
- Alterações de RH geram snapshots versionados (Antes/Depois) e PDFs padronizados
- Transferências de pesquisadores entre projetos exigem aceite digital do coordenador cedente
- O sistema consulta uma API externa "Banco de Especialistas" para dados de pesquisadores (AIE - não mantidos internamente)

## Documentos de Especificação

Todos os requisitos do projeto estão em `docs/`:
- `01-visao-geral.md` - Contexto, escopo, perfis de usuário, restrições
- `02-modulos.md` - Detalhamento dos 6 módulos funcionais (Controle de Acesso, Parametrização, Projetos, Monitoramento, Transferência de RH, Solicitações e Documentos)
- `03-modelo-dados.md` - Modelo ER com nomes e tipos físicos das colunas, alinhado ao `diagrama entidade relacionamento.png`
- `04-regras-negocio.md` - Regras de negócio, lógica de cálculo, fluxos, especificação dos PDFs, matriz de controle de acesso
- `05-cronograma-sprints.md` - Plano de entrega em 4 Sprints
- `06-riscos-e-mitigacao.md` - Riscos e implicações arquiteturais
- `07-metricas-tamanho.md` - Dimensionamento por Pontos de Função (175 PF IFPUG)
- `08-guia-implantacao-alteracao-rh.md` - Guia de implementação do módulo de implantação/alteração de RH com base em PDFs reais
- `09-backlog-sprints.md` - Backlog detalhado por sprint

## Stack Tecnológica

- **Backend**: FastAPI (Python) com PostgreSQL
- **ORM/Migrações**: SQLAlchemy + Alembic
- **Geração de PDF**: módulo isolado (deve ser desacoplado da lógica de negócio para facilitar mudanças de layout)
- **Integração Externa**: API do Banco de Especialistas (consultas somente leitura para dados de pesquisadores)
- **Frontend**: React 19 + Vite 6 + TypeScript 5.8 em `frontend/`
  - Estilização: Tailwind CSS 4 (sem `tailwind.config.js` — usa `@import "tailwindcss"` em `index.css`)
  - Tema: `ThemeContext` (claro/escuro, persistido em localStorage)
  - Animações: Motion (Framer) + classes Tailwind
  - Gráficos: Recharts
  - Forms: React Hook Form + Zod
  - HTTP: Axios com interceptors (Bearer JWT + redirect 401)
  - Roteamento: React Router 7 (configurado em `frontend/src/routes/index.tsx`)
  - Auth: `AuthContext` (JWT em localStorage, `token` + `user`)
  - Services em `frontend/src/services/` (api, authService, projetoService, solicitacaoService, parametroService)
  - Perfis RBAC em `PerfilUsuario` (ADMINISTRADOR, COORDENADOR, GESTOR_POLO, APOIO_COORDENADOR); permissões centralizadas em `usePerfil.ts`
  - Rotas em PT: `/login`, `/dashboard`, `/projetos`, `/projetos/novo` (RoleRoute), `/projetos/:id_projeto`, `/projetos/:id_projeto/implantacao`, `/projetos/:id_projeto/alteracao`, `/solicitacoes`, `/solicitacoes/:id_solicitacao/comparacao`, `/parametros/bolsas` (feature-flag `VITE_FEATURE_BOLSAS=true`)

## Diretrizes de Arquitetura

- Tabelas de parâmetros (valores de bolsas, limites de carga horária) usam vigência temporal (`vigencia_inicio`/`vigencia_fim`) - nunca sobrescrever valores históricos
- O motor de regras (Resolução 11/2022) deve ser orientado a dados via `Parametro_Regra`, não hardcoded
- `Versao_RH_Projeto` registra snapshots da composição da equipe; registros de `Pesquisador_Projeto` se vinculam a uma versão específica via `versao_rh_id`
- A geração de PDF é uma responsabilidade separada do processamento de solicitações - manter em módulo próprio
- Quatro perfis de usuário com permissões distintas: Administrador, Coordenador, Gestor do Polo, Apoio Coordenador

## Ciclo de Vida de Solicitação/Versão RH

Conceito de domínio central — qualquer alteração em `SolicitacaoService` precisa respeitar:

- `Solicitacao_RH.status`: `EM_EDICAO -> SUBMETIDA -> APROVADA | REJEITADA`
- `Versao_RH_Projeto.status`: `PROPOSTA -> VIGENTE -> HISTORICO`
- No máximo **uma** solicitação `EM_EDICAO` por (projeto, tipo) ao mesmo tempo — `criar()` retorna a existente em vez de duplicar
- **`submeter()` move apenas a solicitação para `SUBMETIDA`** — a versão `PROPOSTA` permanece `PROPOSTA` e a `VIGENTE` (se houver) **permanece inalterada**. Isso garante que inclusões/remoções nunca apareçam na equipe oficial sem aprovação do Gestor do Polo.
- **`aprovar()` é quem promove a versão**: `PROPOSTA -> VIGENTE` (e em alteração, a `VIGENTE` anterior vai para `HISTORICO`).
- **`rejeitar()` não desfaz transições de versão** — a `VIGENTE` original nunca foi alterada, então a equipe do projeto continua exatamente como antes da submissão.
- `GET /solicitacoes/{id}/comparacao` retorna `antes`/`depois`/`diferencas` (inclusões, alterações, encerramentos) — usado pela tela de comparação
- `VersaoService.listar_pesquisadores_da_versao_corrente` reflete a equipe **oficial**: retorna a `PROPOSTA` em `EM_EDICAO`/`SUBMETIDA` (apenas para preview das mudanças) e a `VIGENTE` em `APROVADA`/`REJEITADA`/sem solicitação.
- Validação de CH global (`ParametroService.validar_carga_horaria_global`) considera apenas versões `VIGENTE` e exclui o próprio projeto editado (`projeto_id_excluir`) para não contar em dobro
- Detalhes completos em `docs/04-regras-negocio.md` §3 e §5

## Camada de Services (padrão adotado)

A lógica de negócio fica exclusivamente em `backend/app/services/`. Os routers são adaptadores finos: recebem o request, chamam o service e retornam a resposta — sem lógica própria.

- Cada service recebe `db: Session` no `__init__` e é injetado via `Depends` em `app/core/dependencies.py`
- `ParametroService` (`services/parametro_service.py`) centraliza o motor de cálculos da Resolução 11/2022: cálculo proporcional de valor de bolsa e validação de CH global. Não replicar essa lógica em outros services — instanciá-lo por composição quando necessário (ex.: `self.parametros = ParametroService(db)` dentro de `MembroService`)
- Services existentes: `AuthService`, `UsuarioService`, `ProjetoService`, `SolicitacaoService`, `MembroService`, `VersaoService`, `ParametroService`
- Ao criar endpoints novos: criar ou ampliar o service correspondente antes de tocar no router

## Tabelas do Banco de Dados (conforme diagrama ER)

`Usuario_Perfil`, `Parametro_Regra`, `Projeto`, `Projeto_Anexo`, `Pesquisador_Projeto`, `Solicitacao_RH`, `Versao_RH_Projeto`, `Transferencia_RH` e a entidade externa `Pesquisador (AIE)`. Consulte `docs/03-modelo-dados.md` para definições completas das colunas.
