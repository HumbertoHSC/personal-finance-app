// Fonte de dados usada quando não há sessão: tudo em memória, no navegador,
// pra quem está só explorando o app conseguir mexer sem precisar de conta.
// Nada aqui toca a API real nem persiste — some ao recarregar a página.
import type { ApiMeta } from './api';
import type { CategoryInput } from './categories';
import type { TransactionInput } from './transactions';
import type {
  Category,
  CategoryTotal,
  DashboardByCategory,
  DashboardSummary,
  EntryType,
  Transaction,
  TransactionFilters,
} from '../types/api';

let seq = 1;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
}

const now = new Date();
const thisYear = now.getUTCFullYear();
const thisMonth = now.getUTCMonth() + 1;
const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;
const prevMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

function makeCategory(name: string, type: EntryType): Category {
  return { id: nextId('demo-cat'), name, type, userId: 'demo', createdAt: new Date().toISOString() };
}

let categories: Category[] = [
  makeCategory('Salário', 'INCOME'),
  makeCategory('Freelance', 'INCOME'),
  makeCategory('Alimentação', 'EXPENSE'),
  makeCategory('Transporte', 'EXPENSE'),
  makeCategory('Moradia', 'EXPENSE'),
  makeCategory('Lazer', 'EXPENSE'),
  makeCategory('Saúde', 'EXPENSE'),
];

function findCategory(name: string): Category {
  return categories.find((c) => c.name === name)!;
}

function makeTransaction(
  description: string,
  amount: string,
  type: EntryType,
  year: number,
  month: number,
  day: number,
  categoryName: string,
): Transaction {
  const category = findCategory(categoryName);
  return {
    id: nextId('demo-tx'),
    description,
    amount,
    type,
    date: isoDate(year, month, day),
    categoryId: category.id,
    category: { id: category.id, name: category.name, type: category.type },
    createdAt: new Date().toISOString(),
  };
}

let transactions: Transaction[] = [
  makeTransaction('Salário', '4500.00', 'INCOME', thisYear, thisMonth, 5, 'Salário'),
  makeTransaction('Projeto freelance', '800.00', 'INCOME', thisYear, thisMonth, 15, 'Freelance'),
  makeTransaction('Aluguel', '1400.00', 'EXPENSE', thisYear, thisMonth, 10, 'Moradia'),
  makeTransaction('Supermercado', '620.35', 'EXPENSE', thisYear, thisMonth, 12, 'Alimentação'),
  makeTransaction('Uber', '85.00', 'EXPENSE', thisYear, thisMonth, 8, 'Transporte'),
  makeTransaction('Cinema', '75.90', 'EXPENSE', thisYear, thisMonth, 20, 'Lazer'),
  makeTransaction('Farmácia', '92.50', 'EXPENSE', thisYear, thisMonth, 14, 'Saúde'),
  makeTransaction('Salário', '4500.00', 'INCOME', prevMonthYear, prevMonth, 5, 'Salário'),
  makeTransaction('Aluguel', '1400.00', 'EXPENSE', prevMonthYear, prevMonth, 10, 'Moradia'),
  makeTransaction('Supermercado', '580.10', 'EXPENSE', prevMonthYear, prevMonth, 11, 'Alimentação'),
  makeTransaction('Show', '150.00', 'EXPENSE', prevMonthYear, prevMonth, 22, 'Lazer'),
];

function currentMonthKey(month?: string): string {
  return month ?? `${thisYear}-${String(thisMonth).padStart(2, '0')}`;
}

export const demoCategoriesApi = {
  async list(): Promise<Category[]> {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(input: CategoryInput): Promise<Category> {
    const name = input.name.trim();
    if (!name) throw new Error('Nome é obrigatório.');
    if (categories.some((c) => c.name === name)) {
      throw new Error('Já existe uma categoria com esse nome.');
    }
    const category = makeCategory(name, input.type);
    categories.push(category);
    return category;
  },

  async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const category = categories.find((c) => c.id === id);
    if (!category) throw new Error('Categoria não encontrada.');

    const name = input.name?.trim();
    if (name !== undefined) {
      if (!name) throw new Error('Nome é obrigatório.');
      if (name !== category.name && categories.some((c) => c.name === name)) {
        throw new Error('Já existe uma categoria com esse nome.');
      }
    }
    if (input.type !== undefined && input.type !== category.type) {
      if (transactions.some((t) => t.categoryId === id)) {
        throw new Error('Não é possível alterar o tipo de uma categoria que já possui transações.');
      }
    }

    Object.assign(category, { ...input, name: name ?? category.name });
    return category;
  },

  async remove(id: string): Promise<void> {
    if (!categories.some((c) => c.id === id)) throw new Error('Categoria não encontrada.');
    if (transactions.some((t) => t.categoryId === id)) {
      throw new Error('Não é possível excluir uma categoria que possui transações.');
    }
    categories = categories.filter((c) => c.id !== id);
  },
};

export const demoTransactionsApi = {
  async list(filters: TransactionFilters): Promise<{ items: Transaction[]; meta: ApiMeta }> {
    let items = [...transactions];
    if (filters.type) items = items.filter((t) => t.type === filters.type);
    if (filters.category) items = items.filter((t) => t.categoryId === filters.category);
    if (filters.from) items = items.filter((t) => t.date >= filters.from!);
    if (filters.to) items = items.filter((t) => t.date <= `${filters.to}T23:59:59.999Z`);
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const page = filters.page ?? 1;
    const per_page = filters.per_page ?? 20;
    const total = items.length;
    const paged = items.slice((page - 1) * per_page, page * per_page);
    return { items: paged, meta: { total, page, per_page } };
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const description = input.description.trim();
    if (!description) throw new Error('Descrição é obrigatória.');
    const category = categories.find((c) => c.id === input.categoryId);
    if (!category) throw new Error('Categoria não encontrada.');
    if (category.type !== input.type) {
      throw new Error('O tipo da transação precisa ser igual ao tipo da categoria.');
    }
    const transaction: Transaction = {
      id: nextId('demo-tx'),
      description,
      amount: input.amount,
      type: input.type,
      date: input.date,
      categoryId: category.id,
      category: { id: category.id, name: category.name, type: category.type },
      createdAt: new Date().toISOString(),
    };
    transactions.push(transaction);
    return transaction;
  },

  async update(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) throw new Error('Transação não encontrada.');

    const categoryId = input.categoryId ?? transaction.categoryId;
    const type = input.type ?? transaction.type;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) throw new Error('Categoria não encontrada.');
    if (category.type !== type) {
      throw new Error('O tipo da transação precisa ser igual ao tipo da categoria.');
    }

    Object.assign(transaction, input, {
      categoryId: category.id,
      category: { id: category.id, name: category.name, type: category.type },
    });
    return transaction;
  },

  async remove(id: string): Promise<void> {
    if (!transactions.some((t) => t.id === id)) throw new Error('Transação não encontrada.');
    transactions = transactions.filter((t) => t.id !== id);
  },
};

export const demoDashboardApi = {
  async summary(month?: string): Promise<DashboardSummary> {
    const ym = currentMonthKey(month);
    const rows = transactions.filter((t) => t.date.startsWith(ym));
    const income = rows.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = rows.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      month: ym,
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: (income - expense).toFixed(2),
    };
  },

  async byCategory(month?: string): Promise<DashboardByCategory> {
    const ym = currentMonthKey(month);
    const rows = transactions.filter((t) => t.date.startsWith(ym));

    const totals = new Map<string, { name: string; type: EntryType; total: number }>();
    for (const t of rows) {
      const current = totals.get(t.categoryId) ?? { name: t.category.name, type: t.category.type, total: 0 };
      current.total += Number(t.amount);
      totals.set(t.categoryId, current);
    }

    const categoriesOut: CategoryTotal[] = [...totals.entries()]
      .map(([categoryId, v]) => ({ categoryId, name: v.name, type: v.type, total: v.total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    return { month: ym, categories: categoriesOut };
  },
};
