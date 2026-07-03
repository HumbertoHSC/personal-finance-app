import { api, type ApiMeta } from './api';
import type { EntryType, Transaction, TransactionFilters } from '../types/api';

export interface TransactionInput {
  description: string;
  amount: string;
  type: EntryType;
  date: string;
  categoryId: string;
}

function toQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('page', String(filters.page ?? 1));
  params.set('per_page', String(filters.per_page ?? 20));
  return params.toString();
}

export const transactionsApi = {
  async list(filters: TransactionFilters): Promise<{ items: Transaction[]; meta: ApiMeta }> {
    const { data, meta } = await api<Transaction[]>(`/transactions?${toQueryString(filters)}`);
    return { items: data, meta: meta! };
  },

  async create(payload: TransactionInput): Promise<Transaction> {
    const { data } = await api<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async update(id: string, payload: Partial<TransactionInput>): Promise<Transaction> {
    const { data } = await api<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api<null>(`/transactions/${id}`, { method: 'DELETE' });
  },
};
