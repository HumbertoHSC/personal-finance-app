import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const dashboardRepository = {
  sumByType(userId: string, from: Date, to: Date) {
    return prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: from, lt: to } },
      _sum: { amount: true },
    });
  },

  async sumByCategory(userId: string, from: Date, to: Date) {
    const groups = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: from, lt: to } },
      _sum: { amount: true },
    });

    if (groups.length === 0) return [];

    // groupBy não faz join; busca os nomes em uma segunda query
    const categories = await prisma.category.findMany({
      where: { id: { in: groups.map((group) => group.categoryId) } },
      select: { id: true, name: true, type: true },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    return groups.map((group) => {
      const category = categoryById.get(group.categoryId)!;
      return {
        categoryId: group.categoryId,
        name: category.name,
        type: category.type,
        total: group._sum.amount ?? new Prisma.Decimal(0),
      };
    });
  },
};
