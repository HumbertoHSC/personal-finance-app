import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { installFakeRepositories, resetFakeDb } from './support/fake-repositories.js';
import { registerAgent } from './support/helpers.js';

installFakeRepositories();

describe('Categorias', () => {
  beforeEach(() => {
    resetFakeDb();
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
  });

  it('cria, lista ordenado por nome, renomeia e rejeita nome duplicado', async () => {
    const ana = await registerAgent('ana@x.com');

    const create = await ana.post('/api/v1/categories').send({ name: 'Alimentação', type: 'EXPENSE' });
    expect(create.status).toBe(201);
    const alimentacaoId = create.body.data.id;

    const duplicate = await ana.post('/api/v1/categories').send({ name: 'Alimentação', type: 'EXPENSE' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('category_already_exists');

    await ana.post('/api/v1/categories').send({ name: 'Salário', type: 'INCOME' });
    await ana.post('/api/v1/categories').send({ name: 'Lazer', type: 'EXPENSE' });

    const list = await ana.get('/api/v1/categories');
    expect(list.status).toBe(200);
    expect(list.body.data.map((c: { name: string }) => c.name)).toEqual(['Alimentação', 'Lazer', 'Salário']);

    const rename = await ana.patch(`/api/v1/categories/${alimentacaoId}`).send({ name: 'Comida' });
    expect(rename.status).toBe(200);
    expect(rename.body.data.name).toBe('Comida');
  });

  it('valida o corpo da atualização', async () => {
    const ana = await registerAgent('ana@x.com');
    const create = await ana.post('/api/v1/categories').send({ name: 'Lazer', type: 'EXPENSE' });

    const emptyPatch = await ana.patch(`/api/v1/categories/${create.body.data.id}`).send({});
    expect(emptyPatch.status).toBe(422);
  });

  it('isola categorias entre usuários diferentes', async () => {
    const ana = await registerAgent('ana@x.com');
    const beto = await registerAgent('beto@x.com');

    const created = await ana.post('/api/v1/categories').send({ name: 'Viagem', type: 'EXPENSE' });
    const categoryId = created.body.data.id;

    const betoList = await beto.get('/api/v1/categories');
    expect(betoList.body.data).toHaveLength(0);

    const betoEdit = await beto.patch(`/api/v1/categories/${categoryId}`).send({ name: 'Hack' });
    expect(betoEdit.status).toBe(404);

    const betoDelete = await beto.delete(`/api/v1/categories/${categoryId}`);
    expect(betoDelete.status).toBe(404);
  });

  it('bloqueia mudar o tipo ou excluir categoria que já tem transações', async () => {
    const ana = await registerAgent('ana@x.com');
    const category = await ana.post('/api/v1/categories').send({ name: 'Transporte', type: 'EXPENSE' });
    const categoryId = category.body.data.id;

    await ana
      .post('/api/v1/transactions')
      .send({ description: 'Uber', amount: '30.00', type: 'EXPENSE', date: '2026-07-01', categoryId });

    const changeType = await ana.patch(`/api/v1/categories/${categoryId}`).send({ type: 'INCOME' });
    expect(changeType.status).toBe(409);
    expect(changeType.body.error.code).toBe('category_in_use');

    const remove = await ana.delete(`/api/v1/categories/${categoryId}`);
    expect(remove.status).toBe(409);
    expect(remove.body.error.code).toBe('category_in_use');
  });

  it('exclui normalmente uma categoria sem transações', async () => {
    const ana = await registerAgent('ana@x.com');
    const category = await ana.post('/api/v1/categories').send({ name: 'Lazer', type: 'EXPENSE' });

    const remove = await ana.delete(`/api/v1/categories/${category.body.data.id}`);
    expect(remove.status).toBe(204);

    const list = await ana.get('/api/v1/categories');
    expect(list.body.data).toHaveLength(0);
  });
});
