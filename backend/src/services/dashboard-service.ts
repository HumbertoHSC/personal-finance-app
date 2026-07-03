import { Prisma } from '@prisma/client';
import { dashboardRepository } from '../repositories/dashboard-repository.js';
import type { DashboardQuery } from '../schemas/dashboard-schemas.js';

const ZERO = new Prisma.Decimal(0);

// Intervalo meio-aberto [1º dia do mês, 1º dia do mês seguinte) em UTC:
// evita o clássico bug de perder transações do último dia às 23h59
function monthRange(month?: string) {
  const now = new Date();
  const ym =
    month ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const from = new Date(`${ym}-01T00:00:00.000Z`);
  const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
  return { month: ym, from, to };
}

export const dashboardService = {
  async summary(userId: string, query: DashboardQuery) {
    const { month, from, to } = monthRange(query.month);
    const sums = await dashboardRepository.sumByType(userId, from, to);

    const totalOf = (type: 'INCOME' | 'EXPENSE') =>
      sums.find((sum) => sum.type === type)?._sum.amount ?? ZERO;

    const income = totalOf('INCOME');
    const expense = totalOf('EXPENSE');

    return {
      month,
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: income.minus(expense).toFixed(2),
    };
  },

  async byCategory(userId: string, query: DashboardQuery) {
    const { month, from, to } = monthRange(query.month);
    const rows = await dashboardRepository.sumByCategory(userId, from, to);

    const categories = [...rows]
      .sort((a, b) => b.total.comparedTo(a.total))
      .map((row) => ({ ...row, total: row.total.toFixed(2) }));

    return { month, categories };
  },
};
