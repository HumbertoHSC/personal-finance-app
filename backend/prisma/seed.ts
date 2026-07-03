import { CategoryType, PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@financasimples.dev';
const DEMO_PASSWORD = 'demo1234';

const categories: { name: string; type: CategoryType }[] = [
  { name: 'Salário', type: CategoryType.INCOME },
  { name: 'Freelance', type: CategoryType.INCOME },
  { name: 'Alimentação', type: CategoryType.EXPENSE },
  { name: 'Transporte', type: CategoryType.EXPENSE },
  { name: 'Moradia', type: CategoryType.EXPENSE },
  { name: 'Lazer', type: CategoryType.EXPENSE },
  { name: 'Saúde', type: CategoryType.EXPENSE },
];

// amount como string para o Prisma converter em Decimal sem passar por float
const transactions: {
  description: string;
  amount: string;
  type: TransactionType;
  date: string;
  category: string;
}[] = [
  { description: 'Salário de maio', amount: '4500.00', type: TransactionType.INCOME, date: '2026-05-05', category: 'Salário' },
  { description: 'Landing page cliente X', amount: '800.00', type: TransactionType.INCOME, date: '2026-05-18', category: 'Freelance' },
  { description: 'Aluguel de maio', amount: '1400.00', type: TransactionType.EXPENSE, date: '2026-05-10', category: 'Moradia' },
  { description: 'Supermercado', amount: '620.35', type: TransactionType.EXPENSE, date: '2026-05-12', category: 'Alimentação' },
  { description: 'Recarga transporte', amount: '180.00', type: TransactionType.EXPENSE, date: '2026-05-15', category: 'Transporte' },
  { description: 'Cinema', amount: '75.90', type: TransactionType.EXPENSE, date: '2026-05-24', category: 'Lazer' },
  { description: 'Salário de junho', amount: '4500.00', type: TransactionType.INCOME, date: '2026-06-05', category: 'Salário' },
  { description: 'Aluguel de junho', amount: '1400.00', type: TransactionType.EXPENSE, date: '2026-06-10', category: 'Moradia' },
  { description: 'Supermercado', amount: '580.10', type: TransactionType.EXPENSE, date: '2026-06-11', category: 'Alimentação' },
  { description: 'Farmácia', amount: '92.50', type: TransactionType.EXPENSE, date: '2026-06-14', category: 'Saúde' },
  { description: 'Uber', amount: '64.30', type: TransactionType.EXPENSE, date: '2026-06-20', category: 'Transporte' },
  { description: 'Show', amount: '150.00', type: TransactionType.EXPENSE, date: '2026-06-27', category: 'Lazer' },
  { description: 'Salário de julho', amount: '4500.00', type: TransactionType.INCOME, date: '2026-07-03', category: 'Salário' },
  { description: 'Aluguel de julho', amount: '1400.00', type: TransactionType.EXPENSE, date: '2026-07-01', category: 'Moradia' },
  { description: 'Padaria', amount: '48.75', type: TransactionType.EXPENSE, date: '2026-07-02', category: 'Alimentação' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Usuária Demo', passwordHash },
  });

  const categoryIdByName = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: category.name } },
      update: {},
      create: { ...category, userId: user.id },
    });
    categoryIdByName.set(saved.name, saved.id);
  }

  // Recria as transações demo para o seed ser idempotente
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: new Date(`${t.date}T12:00:00.000Z`),
      userId: user.id,
      categoryId: categoryIdByName.get(t.category)!,
    })),
  });

  console.log(`Seed concluído: usuário ${DEMO_EMAIL} (senha: ${DEMO_PASSWORD}), ${categories.length} categorias, ${transactions.length} transações.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
