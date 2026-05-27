# Métricas de Tamanho do Software

## Análise de Pontos de Função (APF)

### Funções de Dados

| Função | Tipo | RET | DER | Complexidade | PF |
|--------|------|-----|-----|-------------|-----|
| Tabela de Usuários/Perfis | ALI | 2 | 6 | Baixa | 7 |
| Tabela de Parâmetros (CH, Bolsas, Tipos) | ALI | 3 | 24 | Média | 10 |
| Tabela de Projetos e Anexos | ALI | 3 | 21 | Média | 10 |
| Tabela de Vínculos de Pesquisadores | ALI | 3 | 24 | Média | 10 |
| Tabela de Solicitações/Versões/Documentos | ALI | 4 | 30 | Média | 10 |
| Tabela de Transferências de RH | ALI | 3 | 22 | Média | 10 |
| Banco de Especialistas (externo) | AIE | 1 | 8 | Baixa | 5 |
| **Subtotal Dados** | | | | | **62** |

### Entradas Externas (EE) - 15 funcoes x 4 PF = 60 PF

Login/Logout, Gestão de Perfis, Gerenciar Limite CH, Gerenciar Categorias/Bolsas, Gerenciar Tipos Solicitação, Gestão Projetos, Upload Documentos, Solicitação Implantação, Solicitação Alteração, Solicitação Pagamento, Incluir Participação, Alterar Participação, Encerrar Participação, Solicitar Transferência, Aceitar Transferência.

### Saidas Externas (SE) - 5 funcoes x 5 PF = 25 PF

PDF Implantação, PDF Alteração RH, PDF Folha Pagamento, Simular/Comparar Versões, Visão Consolidada por Fonte.

### Consultas Externas (CE) - 7 funcoes x 4 PF = 28 PF

Consultar Especialista, Consultar Projetos, Consultar RH/Equipe, Consultar Parâmetros, Consultar Histórico Solicitações, Consultar Transferências, Consultar Versões RH.

---

## Resumo

| Metodo | PF Nao Ajustados | Fator de Ajuste | PF Ajustados |
|--------|-------------------|-----------------|--------------|
| IFPUG Detalhada | 175 | 1,06 | 185,50 |
| NESMA Estimativa | 160 | 1,06 | 169,60 |
| NESMA Indicativa | 225 | 1,06 | 238,50 |

**Orçamento**: 238,50 PF x R$ 1.000,00 = **R$ 238.500,00**
