import type { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '../schemas/category-schemas.js';
import { idParamSchema } from '../schemas/params-schemas.js';
import { categoryService } from '../services/category-service.js';

export const categoryController = {
  async index(req: Request, res: Response) {
    const categories = await categoryService.list(req.userId!);
    res.json({ data: categories });
  },

  async create(req: Request, res: Response) {
    const input = createCategorySchema.parse(req.body);
    const category = await categoryService.create(req.userId!, input);
    res.status(201).json({ data: category });
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(req.userId!, id, input);
    res.json({ data: category });
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await categoryService.remove(req.userId!, id);
    res.status(204).end();
  },
};
