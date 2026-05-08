# Cronograma de Sprints

O desenvolvimento e dividido em 4 Sprints, priorizando nas primeiras iteracoes as funcionalidades centrais do negocio, com dados mockados quando necessario. A parametrizacao completa e transferencias ficam na ultima Sprint.

---

## Sprint 1 - Nucleo de Solicitacoes de RH

Foco: fluxo central de solicitacoes de RH com regras e dados mockados quando necessario.

| Funcionalidade | Modulo |
|----------------|--------|
| Login / Logout e gestao de perfis (Administrador, Coordenador, Gestor do Polo, Apoio Coordenador) | Controle de Acesso |
| Solicitacao de Implantacao inicial de RH | Solicitacoes e Documentos |
| Solicitacao de Alteracao de RH | Solicitacoes e Documentos |
| Inclusao, alteracao e encerramento de membros com calculo e validacao de bolsas e carga horaria | Solicitacoes e Documentos |
| Visualizacao de versoes de RH e comparacao da equipe Atual vs. Proposta | Solicitacoes e Documentos |

---

## Sprint 2 - Gestao de Projetos e Integracao

Foco: gestao de projetos, documentos anexos e integracao com Banco de Especialistas.

| Funcionalidade | Modulo |
|----------------|--------|
| Gestao de Projetos (consulta, inclusao e alteracao de dados basicos) | Projetos |
| Anexos multiplos do projeto (Plano de Trabalho, Acordo de Parceria, extrato no Diario Oficial, aditivos e outros documentos) | Projetos |
| Busca e vinculacao de Especialista via Banco de Especialistas | Projetos |

---

## Sprint 3 - Monitoramento, Pagamento e PDFs

Foco: relatorios de monitoramento, solicitacao de pagamento e geracao automatizada de PDFs.

| Funcionalidade | Modulo |
|----------------|--------|
| Consultas e relatorios de alocacao por projeto, fonte de financiamento e perfil de acesso | Monitoramento |
| Solicitacao de Pagamento de RH por mes/ano especifico | Solicitacoes e Documentos |
| Emissao automatizada dos PDFs de implantacao, alteracao de RH e folha de pagamento | Solicitacoes e Documentos |

---

## Sprint 4 - Parametrizacao e Transferencias

Foco: parametrizacao completa das regras de negocio e modulo de transferencias com homologacao.

| Funcionalidade | Modulo |
|----------------|--------|
| Gestao do limite de carga horaria global e regras de validacao | Parametrizacao |
| Gestao da tabela de categorias e valores da Resolucao 11/2022 com vigencia historica | Parametrizacao |
| Gestao dos tipos de solicitacao/origem de RH (pesquisador prospector, processo seletivo e transferencia entre projetos) | Parametrizacao |
| Cadastro, consulta de pendencias, historico, aceite pelo coordenador cedente e homologacao integrada | Transferencia de RH |

---

## Observacoes

- **Metodologia**: Scrum com entregas incrementais
- **Eventos**: Planejamento de Sprint, Revisoes para validacao com o PO, Retrospectivas
- **Ferramenta de gestao**: OpenProject (backlog, apontamento de horas, rastreamento de bugs)
- **Entrega final prevista**: julho de 2026
