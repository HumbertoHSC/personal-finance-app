import { api } from './api';
import type { DashboardByCategory, DashboardSummary } from '../types/api';

export const dashboardApi = {
  async summary(month?: string): Promise<DashboardSummary> {
    const query = month ? `?month=${month}` : '';
    const { data } = await api<DashboardSummary>(`/dashboard/summary${query}`);
    return data;
  },

  async byCategory(month?: string): Promise<DashboardByCategory> {
    const query = month ? `?month=${month}` : '';
    const { data } = await api<DashboardByCategory>(`/dashboard/by-category${query}`);
    return data;
  },
};
