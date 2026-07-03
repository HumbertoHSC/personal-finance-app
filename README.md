# Finança Simples

App fullstack de controle financeiro pessoal: cadastro de receitas e despesas, categorias, autenticação e dashboard com resumo visual.

> 🚧 Em desenvolvimento — o plano completo do projeto está em [docs/PLANO.md](docs/PLANO.md).

## Stack

- **Backend:** Node.js + Express 5 + TypeScript, Prisma (PostgreSQL), Zod, JWT + bcrypt
- **Frontend:** React + Vite + TypeScript, Chart.js
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

## Progresso

- [x] Setup do projeto, schema Prisma, migration inicial, seed de teste
- [x] Auth (registro, login, refresh, logout, me) + middleware de autenticação + rate limiting
- [x] CRUD de categorias e transações + validação Zod
- [x] Endpoints de dashboard (agregações)
- [ ] Frontend: login, transações, formulários, gráficos
- [ ] Deploy
- [ ] Testes automatizados
