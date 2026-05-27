# Riscos e Estratégias de Mitigação

| Risco | Probabilidade | Impacto | Estratégia de Mitigação |
|-------|--------------|---------|------------------------|
| Alteração nas regras da Resolução 11/2022 pelo IFPB | Média | Alto | Criar a funcionalidade de "Gestão de tabela de categorias com vigência" (Parametrização), permitindo que o administrador altere valores sem necessidade de recompilar o código |
| Atraso no desenvolvimento devido à limitação de horas da equipe | Alta | Médio | Priorizar o escopo principal (MVP) utilizando os relatórios de burndown do OpenProject para acompanhar o progresso e renegociar funcionalidades menos críticas |
| Mudança estrutural nos templates de PDF aceitos pelo SUAP | Baixa | Médio | Isolar o código gerador de relatórios (PDF) do restante das lógicas de negócio, permitindo manutenção rápida e localizada de layout |

## Implicações Arquiteturais

1. **Motor de Regras desacoplado**: as regras da Resolução 11/2022 devem ser parametrizáveis via banco de dados, não hardcoded
2. **Gerador de PDF isolado**: o módulo de geração de PDF deve ser um componente independente, facilitando mudanças de layout sem impacto no restante do sistema
3. **MVP prioritário**: as funcionalidades dos Sprints 1 e 2 formam o MVP - em caso de atraso, Sprints 3 e 4 podem ser renegociados
