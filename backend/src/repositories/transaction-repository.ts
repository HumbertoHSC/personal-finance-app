import type { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface TransactionFilters {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  from?: Date;
  to?: Date;
}

// A listagem sempre devolve a categoria junto; o frontend não precisa de N+1
const categoryInclude = { category: { select: { id: true, name: true, type: true } } } as const;

function toWhere({ userId, type, categoryId, from, to }: TransactionFilters): Prisma.TransactionWhereInput {
  return {
    userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...((from || to) && {
      date: { ...(from && { gte: from }), ...(to && { lte: to }) },
    }),
  };
}

export const transactionRepository = {
  async findManyPaginated(filters: TransactionFilters, page: number, perPage: number) {
    const where = toWhere(filters);
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: categoryInclude,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total };
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.transaction.findFirst({ where: { id, userId }, include: categoryInclude });
  },

  create(data: {
    description: string;
    amount: string;
    type: TransactionType;
    date: Date;
    userId: string;
    categoryId: string;
  }) {
    return prisma.transaction.create({ data, include: categoryInclude });
  },

  update(
    id: string,
    data: {
      description?: string;
      amount?: string;
      type?: TransactionType;
      date?: Date;
      categoryId?: string;
    },
  ) {
    return prisma.transaction.update({ where: { id }, data, include: categoryInclude });
  },

  delete(id: string) {
    return prisma.transaction.delete({ where: { id } });
  },
};
