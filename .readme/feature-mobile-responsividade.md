# Branch: feature/mobile-responsividade

## Objetivo
Melhorar a experiencia mobile do frontend sem alterar regras de negocio.

## Regras da feature
- A sidebar deve funcionar como gaveta em telas pequenas.
- O conteudo principal nao pode ficar espremido quando a sidebar estiver fechada.
- Paginas principais devem evitar overflow horizontal global no mobile.
- Tabelas largas devem usar scroll horizontal controlado dentro do proprio bloco.
- Cabecalhos, acoes e cards devem empilhar em telas pequenas.

## Validacoes
- `npm run build` passou no container frontend.
- Rotas verificadas em largura mobile: `/dashboard`, `/projetos`, `/solicitacoes`.
