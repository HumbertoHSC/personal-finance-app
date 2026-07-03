import { AppError } from '../lib/app-error.js';
import { categoryRepository } from '../repositories/category-repository.js';
import { transactionRepository } from '../repositories/transaction-repository.js';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from '../schemas/transaction-schemas.js';

const TRANSACTION_NOT_FOUND = () =>
  new AppError('transaction_not_found', 'Transação não encontrada.', 404);

// Buscar a categoria sempre com o userId do token: uma categoria de outro
// usuário é indistinguível de uma categoria inexistente
async function ensureCategoryMatches(userId: string, categoryId: string, type: string) {
  const category = await categoryRepository.findByIdForUser(categoryId, userId);
  if (!category) {
    throw new AppError('category_not_found', 'Categoria não encontrada.', 404);
  }
  if (category.type !== type) {
    throw new AppError(
      'category_type_mismatch',
      'O tipo da transação precisa ser igual ao tipo da categoria.',
      400,
    );
  }
}

export const transactionService = {
  list(userId: string, query: ListTransactionsQuery) {
    return transactionRepository.findManyPaginated(
      {
        userId,
        type: query.type,
        categoryId: query.category,
        from: query.from,
        to: query.to,
      },
      query.page,
      query.per_page,
    );
  },

  async get(userId: string, id: string) {
    const transaction = await transactionRepository.findByIdForUser(id, userId);
    if (!transaction) throw TRANSACTION_NOT_FOUND();
    return transaction;
  },

  async create(userId: string, input: CreateTransactionInput) {
    await ensureCategoryMatches(userId, input.categoryId, input.type);
    return transactionRepository.create({ ...input, userId });
  },

  async update(userId: string, id: string, input: UpdateTransactionInput) {
    const current = await transactionRepository.findByIdForUser(id, userId);
    if (!current) throw TRANSACTION_NOT_FOUND();

    // Valida a combinação final categoria + tipo, mesmo quando só um deles muda
    const categoryId = input.categoryId ?? current.categoryId;
    const type = input.type ?? current.type;
    await ensureCategoryMatches(userId, categoryId, type);

    return transactionRepository.update(id, input);
  },

  async remove(userId: string, id: string) {
    const current = await transactionRepository.findByIdForUser(id, userId);
    if (!current) throw TRANSACTION_NOT_FOUND();
    await transactionRepository.delete(id);
  },
};
