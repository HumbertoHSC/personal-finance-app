import { api } from './api';
import type { Category, EntryType } from '../types/api';

export interface CategoryInput {
  name: string;
  type: EntryType;
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await api<Category[]>('/categories');
    return data;
  },

  async create(payload: CategoryInput): Promise<Category> {
    const { data } = await api<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async update(id: string, payload: Partial<CategoryInput>): Promise<Category> {
    const { data } = await api<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api<null>(`/categories/${id}`, { method: 'DELETE' });
  },
};
