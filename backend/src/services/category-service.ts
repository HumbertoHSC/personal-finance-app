import { AppError } from '../lib/app-error.js';
import { categoryRepository } from '../repositories/category-repository.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category-schemas.js';

const CATEGORY_NOT_FOUND = () => new AppError('category_not_found', 'Categoria não encontrada.', 404);

export const categoryService = {
  list(userId: string) {
    return categoryRepository.findManyByUser(userId);
  },

  async create(userId: string, input: CreateCategoryInput) {
    const existing = await categoryRepository.findByNameForUser(input.name, userId);
    if (existing) {
      throw new AppError('category_already_exists', 'Já existe uma categoria com esse nome.', 409);
    }
    return categoryRepository.create({ ...input, userId });
  },

  async update(userId: string, id: string, input: UpdateCategoryInput) {
    const category = await categoryRepository.findByIdForUser(id, userId);
    if (!category) throw CATEGORY_NOT_FOUND();

    if (input.name !== undefined && input.name !== category.name) {
      const duplicate = await categoryRepository.findByNameForUser(input.name, userId);
      if (duplicate) {
        throw new AppError('category_already_exists', 'Já existe uma categoria com esse nome.', 409);
      }
    }

    // Mudar o tipo deixaria as transações existentes inconsistentes com a categoria
    if (input.type !== undefined && input.type !== category.type) {
      const inUse = await categoryRepository.countTransactions(id);
      if (inUse > 0) {
        throw new AppError(
          'category_in_use',
          'Não é possível alterar o tipo de uma categoria que já possui transações.',
          409,
        );
      }
    }

    return categoryRepository.update(id, input);
  },

  async remove(userId: string, id: string) {
    const category = await categoryRepository.findByIdForUser(id, userId);
    if (!category) throw CATEGORY_NOT_FOUND();

    const inUse = await categoryRepository.countTransactions(id);
    if (inUse > 0) {
      throw new AppError(
        'category_in_use',
        'Não é possível excluir uma categoria que possui transações.',
        409,
      );
    }

    await categoryRepository.delete(id);
  },
};
