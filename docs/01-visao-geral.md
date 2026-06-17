# Visão Geral do Projeto

## Gestão RH Banco de Especialistas

Aplicação web para gestão de projetos de PD&I e controle integral de equipes de Recursos Humanos do Polo de Inovação do IFPB.

## Contexto

O sistema atua como núcleo centralizador de informações sobre projetos de PD&I e suas equipes de RH. Funciona como interface principal entre:

- **Coordenador do Projeto**: usuário primário que realiza alocação e solicita alterações na equipe
- **Gestores do Polo de Inovação**: validam informações para trâmite oficial

## Problema e Motivação

A gestão atual é descentralizada e manual, gerando:

1. **Riscos Financeiros e de Auditoria**: erros em cálculos manuais de bolsas proporcionais à carga horária e categorias (Resolução 11/2022) podem levar a reprovações de prestação de contas
2. **Burocracia Excessiva em Alterações**: solicitações de mudanças na equipe exigem levantamentos manuais do histórico ("Antes") para comparação com o proposto ("Depois"), sem fonte única de verdade
3. **Dificuldade de Parametrização Temporal**: alterações nas tabelas de valores de bolsas não são refletidas retroativamente, gerando confusão no cálculo de projetos antigos sem controle de vigência histórica
4. **Inexistência de Visão por Fonte**: falta de clareza sobre distribuição da equipe entre as fontes EMBRAPII, EMPRESA e SEBRAE

## Objetivo

Desenvolver aplicação web com:

- Validações automatizadas de limites de carga horária
- Cálculos financeiros de bolsas
- Manutenção de histórico temporal
- Motor de regras alinhado à Resolução 11/2022
- Banco de dados relacional para conformidade legal
- Geração de documentos PDF padronizados

## Integrações

| Sistema | Tipo de Integração | Descrição |
|---------|-------------------|-----------|
| Banco de Especialistas | Consulta em tempo real | Buscar e vincular especialistas válidos (pesquisadores, estudantes, colaboradores externos) e verificar limites de carga horária |
| SUAP | Saída indireta (PDF) | O sistema NÃO integra via API com o SUAP. Gera documentos PDF padronizados que são inseridos administrativamente no processo do SUAP |

## Escopo Negativo (O que NÃO será feito)

- **Integração direta de API com o SUAP**: a saída é o PDF padronizado, anexado manualmente no SUAP
- **Módulo Financeiro de Pagamentos**: calcula e valida valor da bolsa, mas não realiza transações bancárias, emissão de notas fiscais ou folha de pagamento
- **Gestão de Compras e Materiais**: restrito a RH, sem controle de equipamentos, licitações, diárias e passagens
- **Controle de Ponto Diário**: aloca carga horária semanal máxima, mas não atua como relógio de ponto eletrônico

## Perfis de Usuário

| Perfil | Descrição |
|--------|-----------|
| Administrador | Gestão completa do sistema |
| Coordenador | Coordenador de projeto - aloca equipe e solicita alterações |
| Gestor do Polo | Valida informações para trâmite oficial, visão multi-projeto |
| Apoio Coordenador | Suporte operacional ao coordenador |

## Equipe de Desenvolvimento

| Nome | Função | Horas/Mês |
|------|--------|-----------|
| Erick Victor Carvalho de Araújo | Product Owner | 20 |
| Marcelo Gomes da Silva | Desenvolvedor Back-end | 20 |
| Vinícius Lopes de Alencar | Desenvolvedor Back-end | 20 |
| Lucas Matheus Santos da Silva | Desenvolvedor Front-end | 20 |
| Lindomar da Silva Junior | Desenvolvedor Front-end | 20 |
| Carolina Araújo de Sousa | Analista de QA | 20 |

## Restrições

- Sem integração direta via API com o SUAP
- Restrito à gestão de horas e bolsas com base na Resolução 11/2022
- Limite de dedicação máxima de 20 horas mensais por membro da equipe
