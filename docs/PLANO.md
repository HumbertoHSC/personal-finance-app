# Finança Simples — Plano do Projeto

App fullstack de controle financeiro pessoal: cadastro de receitas/despesas, categorias, autenticação e dashboard com resumo visual.

**Objetivo no portfólio:** mostrar domínio de backend (API REST, modelagem de banco, auth) e uma pitada de dados (agregações, gráficos) — cobrindo as duas vagas que você está buscando.

---

## 1. Stack técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Backend | Node.js + Express + TypeScript | Você já domina JS/Node; TS é diferencial forte em vaga de eng. de software |
| ORM | Prisma | Migrations versionadas, type-safety, produtivo |
| Banco | PostgreSQL | Você já tem no stack; relacional combina com dados financeiros |
| Auth | JWT + bcrypt | Padrão de mercado, simples de implementar bem |
| Validação | Zod | Schemas reutilizáveis entre validação de entrada e tipos |
| Frontend | React + Vite | Mais rápido de configurar que CRA; SPA simples é suficiente |
| Gráficos | Chart.js (react-chartjs-2) | Barato de implementar, resultado visual bom |
| Deploy backend | Render ou Railway | Free tier com Postgres incluso |
| Deploy frontend | Vercel | Deploy de SPA trivial |

---

## 2. Modelagem do banco (schema Prisma)

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String
  createdAt    DateTime      @default(now())
  categories   Category[]
  transactions Transaction[]

  @@index([createdAt])
}

model Category {
  id           String        @id @default(cuid())
  name         String
  type         CategoryType
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
  createdAt    DateTime      @default(now())

  @@index([userId])
  @@unique([userId, name]) // evita categorias duplicadas por usuário
}

model Transaction {
  id          String   @id @default(cuid())
  description String
  amount      Decimal  @db.Decimal(10, 2) // nunca usar Float para dinheiro
  type        TransactionType
  date        DateTime
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())

  @@index([userId, date])   // consultas por período são o caso de uso mais comum
  @@index([categoryId])
}

enum CategoryType {
  INCOME
  EXPENSE
}

enum TransactionType {
  INCOME
  EXPENSE
}
```

**Decisões importantes:**
- `Decimal` em vez de `Float` para `amount` — ponto flutuante gera erro de arredondamento em valores monetários.
- Índice composto `[userId, date]` porque toda consulta de dashboard vai filtrar por usuário e período.
- `@@unique([userId, name])` na categoria evita duplicatas sem precisar de validação manual extra.

---

## 3. Endpoints da API

Seguindo convenção REST (recursos no plural, verbos só em ações que não mapeiam para CRUD):

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/categories
POST   /api/v1/categories
PATCH  /api/v1/categories/:id
DELETE /api/v1/categories/:id

GET    /api/v1/transactions?type=EXPENSE&category=abc&from=2026-01-01&to=2026-01-31&page=1&per_page=20
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id
DELETE /api/v1/transactions/:id

GET    /api/v1/dashboard/summary?month=2026-07   # saldo, total receitas, total despesas
GET    /api/v1/dashboard/by-category?month=2026-07  # dados prontos pro gráfico
```

**Formato de resposta padrão:**

```json
// sucesso
{ "data": { ... }, "meta": { "total": 42, "page": 1, "per_page": 20 } }

// erro
{ "error": { "code": "validation_error", "message": "...", "details": [...] } }
```

**Regras de autorização:** todo endpoint de `transactions` e `categories` verifica que o recurso pertence ao `userId` do token — nunca confiar em `userId` vindo do corpo da requisição, sempre extrair do JWT verificado.

---

## 4. Segurança (checklist a aplicar desde o início)

- [x] Senhas com `bcrypt` (nunca texto plano ou hash fraco)
- [x] JWT em cookie `httpOnly; Secure; SameSite=Strict` (não em localStorage; `Secure` ativo em produção)
- [x] Validação de todo input com Zod antes de tocar no banco
- [x] Toda query de `transactions`/`categories` filtrada por `userId` do token — nunca do body
- [x] Variáveis sensíveis (`DATABASE_URL`, `JWT_SECRET`) em `.env`, nunca commitadas
- [x] `.env` no `.gitignore` desde o primeiro commit
- [x] Rate limiting básico nas rotas de auth (evita brute-force de login)
- [x] Mensagens de erro genéricas pro cliente; detalhes só em log de servidor

---

## 5. Estrutura de pastas

```
financa-simples/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/       # recebe request, chama service, formata response
│   │   ├── services/          # regra de negócio
│   │   ├── repositories/      # acesso ao Prisma
│   │   ├── middlewares/       # auth, error handler, rate limit
│   │   ├── schemas/           # Zod schemas
│   │   ├── routes/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/              # Login, Dashboard, Transactions, Categories
│   │   ├── hooks/
│   │   ├── services/api.ts     # client HTTP centralizado
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## 6. Cronograma sugerido (dentro do seu mês disponível)

| Semana | Entregas |
|---|---|
| Dia 1-2 | Setup do projeto, schema Prisma, migrations, seed de teste |
| Dia 3-5 | Rotas de auth (registro, login, JWT) + middleware de autenticação |
| Dia 6-9 | CRUD de categorias e transações + validação Zod + testes manuais via Postman/Insomnia |
| Dia 10-12 | Endpoints de dashboard (agregações SQL/Prisma) |
| Dia 13-18 | Frontend: telas de login, listagem de transações, formulários, gráfico |
| Dia 19-21 | Deploy (backend + banco no Render/Railway, frontend na Vercel) |
| Dia 22-25 | Testes automatizados básicos (pelo menos auth e um CRUD) |
| Dia 26-30 | README caprichado, prints/gif, ajustes finais, revisão de código |

---

## 7. O que vai impressionar no README final

- GIF do fluxo: login → adicionar transação → ver gráfico atualizar
- Link de demo funcionando (não só "clone e rode")
- Seção explicando decisões técnicas (por que Decimal, por que JWT em cookie, etc.) — mostra maturidade, não só "sei fazer CRUD"
- Badge de cobertura de testes, se implementar
