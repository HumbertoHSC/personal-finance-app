import type { Category, CategoryType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const categoryRepository = {
  findManyByUser(userId: string): Promise<Category[]> {
    return prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  },

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { id, userId } });
  },

  findByNameForUser(name: string, userId: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { userId, name } });
  },

  create(data: { name: string; type: CategoryType; userId: string }): Promise<Category> {
    return prisma.category.create({ data });
  },

  update(id: string, data: { name?: string; type?: CategoryType }): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },

  countTransactions(categoryId: string): Promise<number> {
    return prisma.transaction.count({ where: { categoryId } });
  },
};
