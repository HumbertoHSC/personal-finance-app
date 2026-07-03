import { Router } from 'express';
import { authRoutes } from './auth-routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

routes.use('/auth', authRoutes);

// Próximas fases (ver docs/PLANO.md):
// routes.use('/categories', categoryRoutes);
// routes.use('/transactions', transactionRoutes);
// routes.use('/dashboard', dashboardRoutes);
