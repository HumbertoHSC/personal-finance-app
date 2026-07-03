# Finança Simples

App fullstack de controle financeiro pessoal: cadastro de receitas e despesas, categorias, autenticação e dashboard com resumo visual.

> 🚧 Em desenvolvimento — o plano completo do projeto está em [docs/PLANO.md](docs/PLANO.md).

## Stack

- **Backend:** Node.js + Express 5 + TypeScript, Prisma (PostgreSQL), Zod, JWT + bcrypt
- **Frontend:** React + Vite + TypeScript, React Router
- **Deploy (planejado):** Render/Railway (API + banco) e Vercel (SPA)

## Estrutura

```
├── backend/    # API REST (Express + Prisma)
├── frontend/   # SPA (React + Vite)
└── docs/       # Plano e documentação do projeto
```

## Como rodar

**Pré-requisitos:** Node.js 20+ e PostgreSQL rodando localmente.

### Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL e gere segredos JWT
npm install
npx prisma migrate dev  # aplica a migration inicial (já versionada)
npm run db:seed         # cria usuário demo + categorias + transações
npm run dev             # API em http://localhost:3333
```

Usuário demo criado pelo seed: `demo@financasimples.dev` / senha `demo1234`.

Health check: `GET http://localhost:3333/api/v1/health`

### Frontend

```bash
cd frontend
npm install
npm run dev             # SPA em http://localhost:5173
```

Com o backend rodando, faça login com o usuário demo (`demo@financasimples.dev` / `demo1234`) ou cadastre uma conta nova.

## Decisões técnicas

- **Sem Chart.js no dashboard.** O gráfico de despesas/receitas por categoria é uma tabela HTML real (`<table>`) com uma barra desenhada em CSS por linha — não canvas. Isso dá acessibilidade de graça (leitor de tela lê categoria + valor normalmente, sem precisar de um toggle "ver como tabela" separado) e evita uma dependência só para um gráfico de barras horizontal. A cor da barra (`#2a78d6` claro / `#3987e5` escuro) foi validada contra contraste, banda de luminosidade e croma antes de entrar no código.
- **JWT em cookie `httpOnly`, não em `localStorage`.** Protege contra roubo de token via XSS; o trade-off é exigir `credentials: 'include'` em todo fetch do frontend.

## Progresso

- [x] Setup do projeto, schema Prisma, migration inicial, seed de teste
- [x] Auth (registro, login, refresh, logout, me) + middleware de autenticação + rate limiting
- [x] CRUD de categorias e transações + validação Zod
- [x] Endpoints de dashboard (agregações)
- [x] Frontend: login, transações, formulários, gráficos
- [ ] Deploy
- [ ] Testes automatizados
