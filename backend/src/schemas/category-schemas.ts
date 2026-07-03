import { z } from 'zod';

export const categoryTypeSchema = z.enum(['INCOME', 'EXPENSE']);

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(50, 'Nome pode ter no máximo 50 caracteres');

export const createCategorySchema = z.object({
  name: nameSchema,
  type: categoryTypeSchema,
});

export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    type: categoryTypeSchema.optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.type !== undefined,
    'Informe ao menos um campo para atualizar',
  );

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
