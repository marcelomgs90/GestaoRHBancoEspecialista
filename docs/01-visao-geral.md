# Visao Geral do Projeto

## Gestao RH Banco de Especialistas

Aplicacao web para gestao de projetos de PD&I e controle integral de equipes de Recursos Humanos do Polo de Inovacao do IFPB.

## Contexto

O sistema atua como nucleo centralizador de informacoes sobre projetos de PD&I e suas equipes de RH. Funciona como interface principal entre:

- **Coordenador do Projeto**: usuario primario que realiza alocacao e solicita alteracoes na equipe
- **Gestores do Polo de Inovacao**: validam informacoes para tramite oficial

## Problema e Motivacao

A gestao atual e descentralizada e manual, gerando:

1. **Riscos Financeiros e de Auditoria**: erros em calculos manuais de bolsas proporcionais a carga horaria e categorias (Resolucao 11/2022) podem levar a reprovacoes de prestacao de contas
2. **Burocracia Excessiva em Alteracoes**: solicitacoes de mudancas na equipe exigem levantamentos manuais do historico ("Antes") para comparacao com o proposto ("Depois"), sem fonte unica de verdade
3. **Dificuldade de Parametrizacao Temporal**: alteracoes nas tabelas de valores de bolsas nao sao refletidas retroativamente, gerando confusao no calculo de projetos antigos sem controle de vigencia historica
4. **Inexistencia de Visao por Fonte**: falta de clareza sobre distribuicao da equipe entre as fontes EMBRAPII, EMPRESA, SEBRAE e IFPB

## Objetivo

Desenvolver aplicacao web com:

- Validacoes automatizadas de limites de carga horaria
- Calculos financeiros de bolsas
- Manutencao de historico temporal
- Motor de regras alinhado a Resolucao 11/2022
- Banco de dados relacional para conformidade legal
- Geracao de documentos PDF padronizados

## Integracoes

| Sistema | Tipo de Integracao | Descricao |
|---------|-------------------|-----------|
| Banco de Especialistas | Consulta em tempo real | Buscar e vincular especialistas validos (pesquisadores, estudantes, colaboradores externos) e verificar limites de carga horaria |
| SUAP | Saida indireta (PDF) | O sistema NAO integra via API com o SUAP. Gera documentos PDF padronizados que sao inseridos administrativamente no processo do SUAP |

## Escopo Negativo (O que NAO sera feito)

- **Integracao direta de API com o SUAP**: a saida e o PDF padronizado, anexado manualmente no SUAP
- **Modulo Financeiro de Pagamentos**: calcula e valida valor da bolsa, mas nao realiza transacoes bancarias, emissao de notas fiscais ou folha de pagamento
- **Gestao de Compras e Materiais**: restrito a RH, sem controle de equipamentos, licitacoes, diarias e passagens
- **Controle de Ponto Diario**: aloca carga horaria semanal maxima, mas nao atua como relogio de ponto eletronico

## Perfis de Usuario

| Perfil | Descricao |
|--------|-----------|
| Administrador | Gestao completa do sistema |
| Coordenador | Coordenador de projeto - aloca equipe e solicita alteracoes |
| Gestor do Polo | Valida informacoes para tramite oficial, visao multi-projeto |
| Apoio Coordenador | Suporte operacional ao coordenador |

## Equipe de Desenvolvimento

| Nome | Funcao | Horas/Mes |
|------|--------|-----------|
| Erick Victor Carvalho de Araujo | Product Owner | 20 |
| Marcelo Gomes da Silva | Desenvolvedor Back-end | 20 |
| Vinicius Lopes de Alencar | Desenvolvedor Back-end | 20 |
| Lucas Matheus Santos da Silva | Desenvolvedor Front-end | 20 |
| Lindomar da Silva Junior | Desenvolvedor Front-end | 20 |
| Carolina Araujo de Sousa | Analista de QA | 20 |

## Restricoes

- Sem integracao direta via API com o SUAP
- Restrito a gestao de horas e bolsas com base na Resolucao 11/2022
- Limite de dedicacao maxima de 20 horas mensais por membro da equipe
