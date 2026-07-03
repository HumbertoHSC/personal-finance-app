import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Pick<User, 'name' | 'email' | 'passwordHash'>): Promise<User> {
    return prisma.user.create({ data });
  },
};
