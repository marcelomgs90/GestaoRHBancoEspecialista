# Gestao RH Banco de Especialistas

Aplicacao web para gestao de equipes de projetos de PD&I e Recursos Humanos do **Polo de Inovacao do IFPB**. O sistema aplica as regras da **Resolucao 11/2022** para calculos de bolsas, limites de carga horaria e gera documentos PDF padronizados para submissao no SUAP.

---

## Visao Geral

Coordenadores alocam pesquisadores em projetos com fontes de financiamento especificas (EMBRAPII, EMPRESA, SEBRAE, IFPB). Valores de bolsas sao calculados automaticamente com base na categoria, horas semanais e tabelas de parametros com vigencia temporal. Alteracoes de RH geram snapshots versionados (Antes/Depois) e PDFs padronizados. Transferencias de pesquisadores entre projetos exigem aceite digital do coordenador cedente.

O sistema consulta uma API externa "Banco de Especialistas" para dados de pesquisadores (AIE — nao mantidos internamente).

---

## Stack Tecnologica

- **Backend:** FastAPI (Python) com PostgreSQL
- **ORM/Migracoes:** SQLAlchemy + Alembic
- **Geracao de PDF:** modulo isolado da logica de negocio
- **Integracao externa:** API do Banco de Especialistas (somente leitura)