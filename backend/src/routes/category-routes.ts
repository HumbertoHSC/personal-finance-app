import { Router } from 'express';
import { categoryController } from '../controllers/category-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';

export const categoryRoutes = Router();

categoryRoutes.use(ensureAuthenticated);

categoryRoutes.get('/', categoryController.index);
categoryRoutes.post('/', categoryController.create);
categoryRoutes.patch('/:id', categoryController.update);
categoryRoutes.delete('/:id', categoryController.remove);
