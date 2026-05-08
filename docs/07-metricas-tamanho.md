# Metricas de Tamanho do Software

## Analise de Pontos de Funcao (APF)

### Funcoes de Dados

| Funcao | Tipo | RET | DER | Complexidade | PF |
|--------|------|-----|-----|-------------|-----|
| Tabela de Usuarios/Perfis | ALI | 2 | 6 | Baixa | 7 |
| Tabela de Parametros (CH, Bolsas, Tipos) | ALI | 3 | 24 | Media | 10 |
| Tabela de Projetos e Anexos | ALI | 3 | 21 | Media | 10 |
| Tabela de Vinculos de Pesquisadores | ALI | 3 | 24 | Media | 10 |
| Tabela de Solicitacoes/Versoes/Documentos | ALI | 4 | 30 | Media | 10 |
| Tabela de Transferencias de RH | ALI | 3 | 22 | Media | 10 |
| Banco de Especialistas (externo) | AIE | 1 | 8 | Baixa | 5 |
| **Subtotal Dados** | | | | | **62** |

### Entradas Externas (EE) - 15 funcoes x 4 PF = 60 PF

Login/Logout, Gestao de Perfis, Gerenciar Limite CH, Gerenciar Categorias/Bolsas, Gerenciar Tipos Solicitacao, Gestao Projetos, Upload Documentos, Solicitacao Implantacao, Solicitacao Alteracao, Solicitacao Pagamento, Incluir Participacao, Alterar Participacao, Encerrar Participacao, Solicitar Transferencia, Aceitar Transferencia.

### Saidas Externas (SE) - 5 funcoes x 5 PF = 25 PF

PDF Implantacao, PDF Alteracao RH, PDF Folha Pagamento, Simular/Comparar Versoes, Visao Consolidada por Fonte.

### Consultas Externas (CE) - 7 funcoes x 4 PF = 28 PF

Consultar Especialista, Consultar Projetos, Consultar RH/Equipe, Consultar Parametros, Consultar Historico Solicitacoes, Consultar Transferencias, Consultar Versoes RH.

---

## Resumo

| Metodo | PF Nao Ajustados | Fator de Ajuste | PF Ajustados |
|--------|-------------------|-----------------|--------------|
| IFPUG Detalhada | 175 | 1,06 | 185,50 |
| NESMA Estimativa | 160 | 1,06 | 169,60 |
| NESMA Indicativa | 225 | 1,06 | 238,50 |

**Orcamento**: 238,50 PF x R$ 1.000,00 = **R$ 238.500,00**
