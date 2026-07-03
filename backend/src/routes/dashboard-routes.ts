import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(ensureAuthenticated);

dashboardRoutes.get('/summary', dashboardController.summary);
dashboardRoutes.get('/by-category', dashboardController.byCategory);
