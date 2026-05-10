# Frontend - Gestao RH Banco de Especialistas

Interface web React para o sistema de gestao de RH do Polo de Inovacao do IFPB.

## Stack

- **Framework**: React 18
- **Linguagem**: TypeScript
- **Build Tool**: Vite
- **Roteamento**: React Router DOM
- **HTTP Client**: Axios
- **Estado Global**: Zustand
- **Formularios**: React Hook Form + Zod

## Configuracao

1. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

2. Instale as dependencias:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse: http://localhost:5173

## Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de producao
- `npm run preview` - Visualiza build de producao
- `npm run lint` - Verifica codigo com ESLint
- `npm run format` - Formata codigo com Prettier

## Estrutura

```
frontend/
├── public/            # Assets estaticos
└── src/
    ├── assets/        # Estilos e imagens
    ├── components/    # Componentes reutilizaveis
    │   ├── common/    # Componentes genericos
    │   ├── layout/    # Layout e navegacao
    │   └── solicitacoes/  # Componentes de dominio
    ├── contexts/      # React Context (AuthContext)
    ├── hooks/         # Custom hooks
    ├── pages/         # Paginas/views
    ├── routes/        # Configuracao de rotas
    ├── services/      # Chamadas API
    ├── types/         # TypeScript types
    └── utils/         # Utilitarios
```
