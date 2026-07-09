# feature/dashboard-cards-links

## Objetivo

Melhorar a experiência do dashboard tornando os cards de indicadores navegáveis.

## Regras

- O card "Projetos Ativos" redireciona para a listagem de projetos com filtro de status ativo.
- O card "Total de Projetos" redireciona para a listagem geral de projetos.
- O card "Solicitações Pendentes" redireciona para a listagem de solicitações filtrada por solicitações submetidas.
- O card "Aprovadas" redireciona para a listagem de solicitações filtrada por aprovadas.
- Os itens do bloco "Status de Solicitações" também redirecionam para a listagem filtrada pelo status clicado.
- As listagens de projetos e solicitações passam a respeitar o parâmetro `status` na URL.

## Impacto

- Alteração apenas de navegação e filtros de tela.
- Não muda regras de criação, aprovação, submissão ou persistência de dados.
