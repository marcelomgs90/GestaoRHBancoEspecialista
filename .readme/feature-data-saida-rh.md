# feature/data-saida-rh

## Objetivo

Ao remover um membro já existente na alteração de RH, a tela deve solicitar a data em que ele sai do projeto.

## Regras

- Membros já existentes não são removidos diretamente da equipe proposta.
- Ao clicar em remover um membro existente, o sistema abre um modal para informar a data de saída.
- A data de saída é salva como `data_fim` do membro na equipe proposta.
- A data de saída é obrigatória e deve respeitar o período do membro/projeto:
  - não pode ser anterior à data de início do membro;
  - não pode ser posterior à data final do projeto.
- O membro continua aparecendo na equipe proposta para preservar o histórico e permitir comparação.
- Membros novos adicionados por engano continuam sendo removidos diretamente da lista, pois ainda não existem no RH vigente.

## Impacto

- A regra afeta apenas a tela de Alteração de RH.
- O fluxo de implantação/cadastro inicial não é alterado.
- A persistência usa a atualização de membro já existente, reaproveitando a validação atual de `data_fim` no backend.
