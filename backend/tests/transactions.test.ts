import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { installFakeRepositories, resetFakeDb } from './support/fake-repositories.js';
import { registerAgent } from './support/helpers.js';

installFakeRepositories();

describe('Transações', () => {
  beforeEach(() => {
    resetFakeDb();
  });

  it('valida tipo, categoria inexistente e formato do valor', async () => {
    const ana = await registerAgent('ana@x.com');
    const category = await ana.post('/api/v1/categories').send({ name: 'Alimentação', type: 'EXPENSE' });
    const categoryId = category.body.data.id;

    const typeMismatch = await ana
      .post('/api/v1/transactions')
      .send({ description: 'Errada', amount: '10', type: 'INCOME', date: '2026-06-01', categoryId });
    expect(typeMismatch.status).toBe(400);
    expect(typeMismatch.body.error.code).toBe('category_type_mismatch');

    const unknownCategory = await ana
      .post('/api/v1/transactions')
      .send({ description: 'Errada', amount: '10', type: 'EXPENSE', date: '2026-06-01', categoryId: 'nao-existe' });
    expect(unknownCategory.status).toBe(404);
    expect(unknownCategory.body.error.code).toBe('category_not_found');

    const badAmount = await ana
      .post('/api/v1/transactions')
      .send({ description: 'Errada', amount: '10.555', type: 'EXPENSE', date: '2026-06-01', categoryId });
    expect(badAmount.status).toBe(422);
  });

  it('cria, lista ordenado por data, filtra e pagina', async () => {
    const ana = await registerAgent('ana@x.com');
    const salario = await ana.post('/api/v1/categories').send({ name: 'Salário', type: 'INCOME' });
    const alimentacao = await ana.post('/api/v1/categories').send({ name: 'Alimentação', type: 'EXPENSE' });

    await ana.post('/api/v1/transactions').send({
      description: 'Salário junho',
      amount: '4500.00',
      type: 'INCOME',
      date: '2026-06-05',
      categoryId: salario.body.data.id,
    });
    await ana.post('/api/v1/transactions').send({
      description: 'Mercado',
      amount: '600.35',
      type: 'EXPENSE',
      date: '2026-06-10',
      categoryId: alimentacao.body.data.id,
    });
    const padaria = await ana.post('/api/v1/transactions').send({
      description: 'Padaria',
      amount: '50.00',
      type: 'EXPENSE',
      date: '2026-07-01',
      categoryId: alimentacao.body.data.id,
    });

    const all = await ana.get('/api/v1/transactions');
    expect(all.body.meta.total).toBe(3);
    expect(all.body.data[0].id).toBe(padaria.body.data.id); // mais recente primeiro
    expect(all.body.data[0].category.name).toBe('Alimentação'); // categoria embutida

    const byPeriod = await ana.get('/api/v1/transactions?from=2026-06-01&to=2026-06-30');
    expect(byPeriod.body.meta.total).toBe(2);

    const byTypeAndPeriod = await ana.get('/api/v1/transactions?type=EXPENSE&from=2026-06-01&to=2026-06-30');
    expect(byTypeAndPeriod.body.meta.total).toBe(1);

    const byCategory = await ana.get(`/api/v1/transactions?category=${alimentacao.body.data.id}`);
    expect(byCategory.body.meta.total).toBe(2);

    const paginated = await ana.get('/api/v1/transactions?per_page=1&page=2');
    expect(paginated.body.data).toHaveLength(1);
    expect(paginated.body.meta).toMatchObject({ page: 2, per_page: 1, total: 3 });
  });

  it('atualiza validando a combinação final de tipo e categoria', async () => {
    const ana = await registerAgent('ana@x.com');
    const salario = await ana.post('/api/v1/categories').send({ name: 'Salário', type: 'INCOME' });
    const alimentacao = await ana.post('/api/v1/categories').send({ name: 'Alimentação', type: 'EXPENSE' });

    const transaction = await ana.post('/api/v1/transactions').send({
      description: 'Mercado',
      amount: '100.00',
      type: 'EXPENSE',
      date: '2026-06-10',
      categoryId: alimentacao.body.data.id,
    });

    const invalidUpdate = await ana
      .patch(`/api/v1/transactions/${transaction.body.data.id}`)
      .send({ categoryId: salario.body.data.id });
    expect(invalidUpdate.status).toBe(400);
    expect(invalidUpdate.body.error.code).toBe('category_type_mismatch');

    const validUpdate = await ana
      .patch(`/api/v1/transactions/${transaction.body.data.id}`)
      .send({ amount: '150.00' });
    expect(validUpdate.status).toBe(200);
    // valor numérico é o que importa; Decimal normaliza zeros à direita na
    // serialização (rotas de transação não formatam com toFixed, diferente do dashboard)
    expect(Number(validUpdate.body.data.amount)).toBe(150);
  });

  it('isola transações entre usuários e permite exclusão', async () => {
    const ana = await registerAgent('ana@x.com');
    const beto = await registerAgent('beto@x.com');
    const category = await ana.post('/api/v1/categories').send({ name: 'Lazer', type: 'EXPENSE' });

    const transaction = await ana.post('/api/v1/transactions').send({
      description: 'Cinema',
      amount: '40.00',
      type: 'EXPENSE',
      date: '2026-06-20',
      categoryId: category.body.data.id,
    });

    const betoRead = await beto.get(`/api/v1/transactions/${transaction.body.data.id}`);
    expect(betoRead.status).toBe(404);

    const remove = await ana.delete(`/api/v1/transactions/${transaction.body.data.id}`);
    expect(remove.status).toBe(204);

    const afterDelete = await ana.get(`/api/v1/transactions/${transaction.body.data.id}`);
    expect(afterDelete.status).toBe(404);
  });
});
