import { Router } from 'express';
import { transactionController } from '../controllers/transaction-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';

export const transactionRoutes = Router();

transactionRoutes.use(ensureAuthenticated);

transactionRoutes.get('/', transactionController.index);
transactionRoutes.post('/', transactionController.create);
transactionRoutes.get('/:id', transactionController.show);
transactionRoutes.patch('/:id', transactionController.update);
transactionRoutes.delete('/:id', transactionController.remove);
