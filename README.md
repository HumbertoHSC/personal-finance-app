# Finança Simples

App fullstack de controle financeiro pessoal: cadastro de receitas e despesas, categorias, autenticação e dashboard com resumo visual.

> 🚧 Em desenvolvimento — o plano completo do projeto está em [docs/PLANO.md](docs/PLANO.md).

## Stack

- **Backend:** Node.js + Express 5 + TypeScript, Prisma (PostgreSQL), Zod, JWT + bcrypt
- **Frontend:** React + Vite + TypeScript, React Router
- **Deploy:** Vercel (frontend e backend no mesmo projeto, via [Services](https://vercel.com/docs/services)) + Neon (Postgres)

## Estrutura

```
├── backend/      # API REST (Express + Prisma)
├── frontend/     # SPA (React + Vite)
├── docs/         # Plano e documentação do projeto
└── vercel.json   # roteamento: /api/* → backend, resto → frontend
```

## Como rodar

**Pré-requisitos:** Node.js 20+ e um PostgreSQL (local ou um free tier como [Neon](https://neon.tech)).

### Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL/DIRECT_URL e gere segredos JWT
npm install
npx prisma migrate deploy  # aplica a migration inicial (já versionada)
npm run db:seed            # cria usuário demo + categorias + transações
npm run dev                 # API em http://localhost:3333
```

Usando Neon/Supabase: `DATABASE_URL` é a connection string do **pooler** (com `pgbouncer=true`), usada pela aplicação em runtime; `DIRECT_URL` é a conexão **direta**, usada só pelo Prisma Migrate — DDL e advisory locks não funcionam de forma confiável através de PgBouncer em modo transaction. Rodando Postgres local sem pooler, as duas variáveis apontam para a mesma URL.

Usuário demo criado pelo seed: `demo@financasimples.dev` / senha `demo1234`.

Health check: `GET http://localhost:3333/api/v1/health`

### Frontend

```bash
cd frontend
npm install
npm run dev             # SPA em http://localhost:5173
```

Com o backend rodando, faça login com o usuário demo (`demo@financasimples.dev` / `demo1234`) ou cadastre uma conta nova.

## Deploy

Frontend e backend são publicados como um projeto único na Vercel usando [Services](https://vercel.com/docs/services): o `vercel.json` na raiz define dois serviços (`frontend`, Vite; `backend`, Express) e roteia `/api/*` para o backend e o resto para o frontend — os dois ficam no mesmo domínio.

1. Importe o repositório na Vercel apontando a **raiz do monorepo** (não uma subpasta).
2. Configure as variáveis de ambiente do projeto (usadas pelo serviço `backend`):
   - `DATABASE_URL`, `DIRECT_URL` (Neon — ver `backend/.env.example`)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `NODE_ENV=production` (a Vercel já define isso automaticamente em produção)
3. Deploy. O build do backend roda `npx prisma generate` (definido em `vercel.json`) — o Prisma Client precisa ser gerado na própria máquina de build da Vercel (Linux), não reaproveitar o gerado localmente no Windows.
4. Rode a migration contra o banco de produção uma vez, localmente: `DATABASE_URL=<direct-do-neon> npx prisma migrate deploy` (dentro de `backend/`).

Como frontend e backend ficam no mesmo domínio (same-origin), **não é preciso configurar `VITE_API_URL`** em produção — o client HTTP do frontend já usa caminho relativo quando a variável não aponta para `localhost`.

## Decisões técnicas

- **Sem Chart.js no dashboard.** O gráfico de despesas/receitas por categoria é uma tabela HTML real (`<table>`) com uma barra desenhada em CSS por linha — não canvas. Isso dá acessibilidade de graça (leitor de tela lê categoria + valor normalmente, sem precisar de um toggle "ver como tabela" separado) e evita uma dependência só para um gráfico de barras horizontal. A cor da barra (`#2a78d6` claro / `#3987e5` escuro) foi validada contra contraste, banda de luminosidade e croma antes de entrar no código.
- **JWT em cookie `httpOnly`, não em `localStorage`.** Protege contra roubo de token via XSS.
- **Frontend e backend no mesmo domínio (Vercel Services), não em domínios separados.** Elimina CORS entre eles e permite `SameSite=Strict` no cookie sem fricção — a alternativa (backend num host, frontend em outro) exigiria `SameSite=None` ou configuração extra de CORS com credentials, superfície de ataque maior pra um ganho nenhum aqui.

## Progresso

- [x] Setup do projeto, schema Prisma, migration inicial, seed de teste
- [x] Auth (registro, login, refresh, logout, me) + middleware de autenticação + rate limiting
- [x] CRUD de categorias e transações + validação Zod
- [x] Endpoints de dashboard (agregações)
- [x] Frontend: login, transações, formulários, gráficos
- [ ] Deploy
- [ ] Testes automatizados
