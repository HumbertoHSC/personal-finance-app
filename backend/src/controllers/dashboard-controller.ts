import type { Request, Response } from 'express';
import { dashboardQuerySchema } from '../schemas/dashboard-schemas.js';
import { dashboardService } from '../services/dashboard-service.js';

export const dashboardController = {
  async summary(req: Request, res: Response) {
    const query = dashboardQuerySchema.parse(req.query);
    const data = await dashboardService.summary(req.userId!, query);
    res.json({ data });
  },

  async byCategory(req: Request, res: Response) {
    const query = dashboardQuerySchema.parse(req.query);
    const data = await dashboardService.byCategory(req.userId!, query);
    res.json({ data });
  },
};
