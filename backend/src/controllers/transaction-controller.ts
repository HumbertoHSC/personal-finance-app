import type { Request, Response } from 'express';
import { idParamSchema } from '../schemas/params-schemas.js';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '../schemas/transaction-schemas.js';
import { transactionService } from '../services/transaction-service.js';

export const transactionController = {
  async index(req: Request, res: Response) {
    const query = listTransactionsQuerySchema.parse(req.query);
    const { items, total } = await transactionService.list(req.userId!, query);
    res.json({ data: items, meta: { total, page: query.page, per_page: query.per_page } });
  },

  async show(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const transaction = await transactionService.get(req.userId!, id);
    res.json({ data: transaction });
  },

  async create(req: Request, res: Response) {
    const input = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.create(req.userId!, input);
    res.status(201).json({ data: transaction });
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const input = updateTransactionSchema.parse(req.body);
    const transaction = await transactionService.update(req.userId!, id, input);
    res.json({ data: transaction });
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await transactionService.remove(req.userId!, id);
    res.status(204).end();
  },
};
