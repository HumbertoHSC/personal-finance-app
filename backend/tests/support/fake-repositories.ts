// Fakes em memória para os repositories — os testes exercitam a API real
// (rotas → controllers → services) sem precisar de um Postgres de verdade.
// Os retornos reais do Prisma são "fluent clients" encadeáveis (não Promise
// simples) e `amount` chega como string nos métodos de escrita — os casts
// abaixo servem só pra isso, o dublê continua batendo com o formato usado
// de verdade pelos controllers/services.
import { Prisma, type Category, type Transaction, type TransactionType, type User } from '@prisma/client';
import { categoryRepository } from '../../src/repositories/category-repository.js';
import { transactionRepository } from '../../src/repositories/transaction-repository.js';
import { userRepository } from '../../src/repositories/user-repository.js';

let seq = 1;
const nextId = (prefix: string) => `${prefix}${seq++}`;

let users: User[] = [];
let categories: Category[] = [];
let transactions: Transaction[] = [];

export function resetFakeDb(): void {
  seq = 1;
  users = [];
  categories = [];
  transactions = [];
}

function withCategory(transaction: Transaction) {
  const category = categories.find((c) => c.id === transaction.categoryId)!;
  return { ...transaction, category: { id: category.id, name: category.name, type: category.type } };
}

let installed = false;

export function installFakeRepositories(): void {
  if (installed) return;
  installed = true;

  Object.assign(userRepository, {
    findByEmail: async (email: string) => users.find((u) => u.email === email) ?? null,
    findById: async (id: string) => users.find((u) => u.id === id) ?? null,
    create: async (data: Pick<User, 'name' | 'email' | 'passwordHash'>) => {
      const user: User = { id: nextId('user_'), createdAt: new Date(), ...data };
      users.push(user);
      return user;
    },
  } as unknown as Partial<typeof userRepository>);

  Object.assign(categoryRepository, {
    findManyByUser: async (userId: string) =>
      categories.filter((c) => c.userId === userId).sort((a, b) => a.name.localeCompare(b.name)),
    findByIdForUser: async (id: string, userId: string) =>
      categories.find((c) => c.id === id && c.userId === userId) ?? null,
    findByNameForUser: async (name: string, userId: string) =>
      categories.find((c) => c.userId === userId && c.name === name) ?? null,
    create: async (data: Pick<Category, 'name' | 'type' | 'userId'>) => {
      const category: Category = { id: nextId('cat_'), createdAt: new Date(), ...data };
      categories.push(category);
      return category;
    },
    update: async (id: string, data: Partial<Pick<Category, 'name' | 'type'>>) => {
      const category = categories.find((c) => c.id === id)!;
      Object.assign(category, data);
      return category;
    },
    delete: async (id: string) => {
      const category = categories.find((c) => c.id === id)!;
      categories = categories.filter((c) => c.id !== id);
      return category;
    },
    countTransactions: async (categoryId: string) =>
      transactions.filter((t) => t.categoryId === categoryId).length,
  } as unknown as Partial<typeof categoryRepository>);

  Object.assign(transactionRepository, {
    findManyPaginated: async (
      filters: { userId: string; type?: TransactionType; categoryId?: string; from?: Date; to?: Date },
      page: number,
      perPage: number,
    ) => {
      let items = transactions.filter((t) => t.userId === filters.userId);
      if (filters.type) items = items.filter((t) => t.type === filters.type);
      if (filters.categoryId) items = items.filter((t) => t.categoryId === filters.categoryId);
      if (filters.from) items = items.filter((t) => t.date >= filters.from!);
      if (filters.to) items = items.filter((t) => t.date <= filters.to!);
      items = [...items].sort(
        (a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const total = items.length;
      const paged = items.slice((page - 1) * perPage, page * perPage).map(withCategory);
      return { items: paged, total };
    },
    findByIdForUser: async (id: string, userId: string) => {
      const transaction = transactions.find((t) => t.id === id && t.userId === userId);
      return transaction ? withCategory(transaction) : null;
    },
    create: async (data: {
      description: string;
      amount: string;
      type: TransactionType;
      date: Date;
      userId: string;
      categoryId: string;
    }) => {
      const transaction: Transaction = {
        id: nextId('tx_'),
        createdAt: new Date(),
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        date: data.date,
        userId: data.userId,
        categoryId: data.categoryId,
      };
      transactions.push(transaction);
      return withCategory(transaction);
    },
    update: async (
      id: string,
      data: Partial<{
        description: string;
        amount: string;
        type: TransactionType;
        date: Date;
        categoryId: string;
      }>,
    ) => {
      const transaction = transactions.find((t) => t.id === id)!;
      Object.assign(transaction, {
        ...data,
        ...(data.amount !== undefined && { amount: new Prisma.Decimal(data.amount) }),
      });
      return withCategory(transaction);
    },
    delete: async (id: string) => {
      const transaction = transactions.find((t) => t.id === id)!;
      transactions = transactions.filter((t) => t.id !== id);
      return transaction;
    },
  } as unknown as Partial<typeof transactionRepository>);
}
