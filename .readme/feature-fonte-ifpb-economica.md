# Branch: feature/fonte-ifpb-economica

## Objetivo
Adicionar a fonte IFPB como valor economico/contrapartida do projeto.

## Regras da feature
- IFPB deve aparecer no cadastro de projeto como `IFPB*`.
- O asterisco deve informar que IFPB e valor economico/contrapartida.
- O valor IFPB deve somar no total das fontes do projeto.
- IFPB nao deve aparecer nas telas de implantacao e alteracao como fonte de RH.
- O backend deve bloquear IFPB em membros de RH, mesmo se a API for chamada diretamente.

## Validacoes
- `npm run build` passou no container frontend.
- Testes focados passaram:
  - projeto aceita IFPB como fonte economica.
  - membro de RH rejeita fonte IFPB.
