import { Router } from 'express';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

// Próximas fases (ver docs/PLANO.md):
// routes.use('/auth', authRoutes);
// routes.use('/categories', categoryRoutes);
// routes.use('/transactions', transactionRoutes);
// routes.use('/dashboard', dashboardRoutes);
