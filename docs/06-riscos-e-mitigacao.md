# Riscos e Estrategias de Mitigacao

| Risco | Probabilidade | Impacto | Estrategia de Mitigacao |
|-------|--------------|---------|------------------------|
| Alteracao nas regras da Resolucao 11/2022 pelo IFPB | Media | Alto | Criar a funcionalidade de "Gestao de tabela de categorias com vigencia" (Parametrizacao), permitindo que o administrador altere valores sem necessidade de recompilar o codigo |
| Atraso no desenvolvimento devido a limitacao de horas da equipe | Alta | Medio | Priorizar o escopo principal (MVP) utilizando os relatorios de burndown do OpenProject para acompanhar o progresso e renegociar funcionalidades menos criticas |
| Mudanca estrutural nos templates de PDF aceitos pelo SUAP | Baixa | Medio | Isolar o codigo gerador de relatorios (PDF) do restante das logicas de negocio, permitindo manutencao rapida e localizada de layout |

## Implicacoes Arquiteturais

1. **Motor de Regras desacoplado**: as regras da Resolucao 11/2022 devem ser parametrizaveis via banco de dados, nao hardcoded
2. **Gerador de PDF isolado**: o modulo de geracao de PDF deve ser um componente independente, facilitando mudancas de layout sem impacto no restante do sistema
3. **MVP prioritario**: as funcionalidades dos Sprints 1 e 2 formam o MVP - em caso de atraso, Sprints 3 e 4 podem ser renegociados
