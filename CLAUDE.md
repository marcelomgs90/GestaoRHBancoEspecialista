# CLAUDE.md

Este arquivo fornece orientacoes ao Claude Code (claude.ai/code) para trabalhar com o codigo deste repositorio.

## Visao Geral do Projeto

**Gestao RH Banco de Especialistas** - Aplicacao web para gestao de equipes de projetos de PD&I e Recursos Humanos do Polo de Inovacao do IFPB. O sistema aplica as regras da Resolucao 11/2022 para calculos de bolsas, limites de carga horaria e gera documentos PDF padronizados para submissao no SUAP.

Conceitos-chave do dominio:
- Coordenadores alocam pesquisadores em projetos com fontes de financiamento especificas (EMBRAPII, EMPRESA, SEBRAE, IFPB)
- Valores de bolsas sao calculados automaticamente com base na categoria, horas semanais e tabelas de parametros com vigencia temporal
- Alteracoes de RH geram snapshots versionados (Antes/Depois) e PDFs padronizados
- Transferencias de pesquisadores entre projetos exigem aceite digital do coordenador cedente
- O sistema consulta uma API externa "Banco de Especialistas" para dados de pesquisadores (AIE - nao mantidos internamente)

## Documentos de Especificacao

Todos os requisitos do projeto estao em `docs/`:
- `01-visao-geral.md` - Contexto, escopo, perfis de usuario, restricoes
- `02-modulos.md` - Detalhamento dos 6 modulos funcionais (Controle de Acesso, Parametrizacao, Projetos, Monitoramento, Transferencia de RH, Solicitacoes e Documentos)
- `03-modelo-dados.md` - Modelo ER com nomes e tipos fisicos das colunas, alinhado ao `diagrama entidade relacionamento.png`
- `04-regras-negocio.md` - Regras de negocio, logica de calculo, fluxos, especificacao dos PDFs, matriz de controle de acesso
- `05-cronograma-sprints.md` - Plano de entrega em 4 Sprints
- `06-riscos-e-mitigacao.md` - Riscos e implicacoes arquiteturais
- `07-metricas-tamanho.md` - Dimensionamento por Pontos de Funcao (175 PF IFPUG)

## Stack Tecnologica

- **Backend**: FastAPI (Python) com PostgreSQL
- **ORM/Migracoes**: SQLAlchemy + Alembic
- **Geracao de PDF**: modulo isolado (deve ser desacoplado da logica de negocio para facilitar mudancas de layout)
- **Integracao Externa**: API do Banco de Especialistas (consultas somente leitura para dados de pesquisadores)
- **Frontend**: React 19 + Vite 6 + TypeScript 5.8 em `frontend/`
  - Estilizacao: Tailwind CSS 4 (sem `tailwind.config.js` — usa `@import "tailwindcss"` em `index.css`)
  - Animacoes: Motion (Framer) + classes Tailwind
  - Graficos: Recharts
  - Forms: React Hook Form + Zod
  - HTTP: Axios com interceptors (Bearer JWT + redirect 401)
  - Roteamento: React Router 7
  - Auth: `AuthContext` (JWT em localStorage, `token` + `user`)
  - Services em `frontend/src/services/` (api, authService, projetoService, solicitacaoService, parametroService)
  - Perfis RBAC em `PerfilUsuario` (ADMINISTRADOR, COORDENADOR, GESTOR_POLO, APOIO_COORDENADOR); permissoes centralizadas em `usePerfil.ts`
  - Rotas em PT: `/login`, `/dashboard`, `/projetos`, `/projetos/novo` (RoleRoute), `/projetos/:id_projeto`, `/projetos/:id_projeto/implantacao`, `/solicitacoes`, `/parametros/bolsas` (feature-flag `VITE_FEATURE_BOLSAS=true`)
  - `frontend_legacy/` preserva o frontend anterior para referencia (pode ser removido apos validacao)

## Diretrizes de Arquitetura

- Tabelas de parametros (valores de bolsas, limites de carga horaria) usam vigencia temporal (`vigencia_inicio`/`vigencia_fim`) - nunca sobrescrever valores historicos
- O motor de regras (Resolucao 11/2022) deve ser orientado a dados via `Parametro_Regra`, nao hardcoded
- `Versao_RH_Projeto` registra snapshots da composicao da equipe; registros de `Pesquisador_Projeto` se vinculam a uma versao especifica via `versao_rh_id`
- A geracao de PDF e uma responsabilidade separada do processamento de solicitacoes - manter em modulo proprio
- Quatro perfis de usuario com permissoes distintas: Administrador, Coordenador, Gestor do Polo, Apoio Coordenador

## Camada de Services (padrao adotado)

A logica de negocio fica exclusivamente em `backend/app/services/`. Os routers sao adaptadores finos: recebem o request, chamam o service e retornam a resposta — sem logica propria.

- Cada service recebe `db: Session` no `__init__` e e injetado via `Depends` em `app/core/dependencies.py`
- `ParametroService` (`services/parametro_service.py`) centraliza o motor de calculos da Resolucao 11/2022: calculo proporcional de valor de bolsa e validacao de CH global. Nao replicar essa logica em outros services — instanciá-lo por composicao quando necessario (ex.: `self.parametros = ParametroService(db)` dentro de `MembroService`)
- Services existentes: `AuthService`, `UsuarioService`, `ProjetoService`, `SolicitacaoService`, `MembroService`, `VersaoService`, `ParametroService`
- Ao criar endpoints novos: criar ou ampliar o service correspondente antes de tocar no router

## Tabelas do Banco de Dados (conforme diagrama ER)

`Usuario_Perfil`, `Parametro_Regra`, `Projeto`, `Projeto_Anexo`, `Pesquisador_Projeto`, `Solicitacao_RH`, `Versao_RH_Projeto`, `Transferencia_RH` e a entidade externa `Pesquisador (AIE)`. Consulte `docs/03-modelo-dados.md` para definicoes completas das colunas.
