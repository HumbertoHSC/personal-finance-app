import { Router } from 'express';
import { authRoutes } from './auth-routes.js';
import { categoryRoutes } from './category-routes.js';
import { dashboardRoutes } from './dashboard-routes.js';
import { transactionRoutes } from './transaction-routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

routes.use('/auth', authRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/transactions', transactionRoutes);
routes.use('/dashboard', dashboardRoutes);
