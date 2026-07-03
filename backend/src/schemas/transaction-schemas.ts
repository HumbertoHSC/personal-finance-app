import { z } from 'zod';
import { categoryTypeSchema } from './category-schemas.js';

// Aceita número ou string, mas sempre vira string antes de chegar ao Prisma:
// Decimal a partir de string não passa por float em nenhum momento
const amountSchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value))
  .refine(
    (value) => /^\d{1,8}(\.\d{1,2})?$/.test(value),
    'Valor inválido: use um número positivo com até 2 casas decimais',
  )
  .refine((value) => Number(value) > 0, 'Valor precisa ser maior que zero');

// Aceita "2026-07-03" ou ISO completo; data pura vira meia-noite UTC
const dateSchema = z
  .union([z.iso.date(), z.iso.datetime()])
  .transform((value) => new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value));

const descriptionSchema = z
  .string()
  .trim()
  .min(1, 'Descrição é obrigatória')
  .max(140, 'Descrição pode ter no máximo 140 caracteres');

export const createTransactionSchema = z.object({
  description: descriptionSchema,
  amount: amountSchema,
  type: categoryTypeSchema,
  date: dateSchema,
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

export const updateTransactionSchema = z
  .object({
    description: descriptionSchema.optional(),
    amount: amountSchema.optional(),
    type: categoryTypeSchema.optional(),
    date: dateSchema.optional(),
    categoryId: z.string().min(1).optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    'Informe ao menos um campo para atualizar',
  );

export const listTransactionsQuerySchema = z.object({
  type: categoryTypeSchema.optional(),
  category: z.string().min(1).optional(),
  from: z.iso
    .date()
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined)),
  to: z.iso
    .date()
    .optional()
    .transform((value) => (value ? new Date(`${value}T23:59:59.999Z`) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
