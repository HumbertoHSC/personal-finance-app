export type EntryType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: EntryType;
  userId: string;
  createdAt: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: EntryType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: EntryType;
  date: string;
  categoryId: string;
  category: TransactionCategory;
  createdAt: string;
}

export interface TransactionFilters {
  type?: EntryType;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export interface DashboardSummary {
  month: string;
  income: string;
  expense: string;
  balance: string;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  type: EntryType;
  total: string;
}

export interface DashboardByCategory {
  month: string;
  categories: CategoryTotal[];
}
