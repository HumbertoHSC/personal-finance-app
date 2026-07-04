import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { installFakeRepositories, resetFakeDb } from './support/fake-repositories.js';

installFakeRepositories();

describe('Auth', () => {
  beforeEach(() => {
    resetFakeDb();
  });

  it('rejeita registro com dados inválidos', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'nao-eh-email', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('registra, normaliza o e-mail e nunca expõe passwordHash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana Souza', email: '  ANA@Exemplo.com ', password: 'senha-muito-segura' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ana@exemplo.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const accessCookie = cookies.find((c) => c.startsWith('access_token='))!;
    const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='))!;
    expect(accessCookie).toMatch(/HttpOnly/);
    expect(accessCookie).toMatch(/SameSite=Strict/);
    expect(refreshCookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('rejeita e-mail duplicado', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'senha-muito-segura' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Outra', email: 'ana@x.com', password: 'senha-muito-segura' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_already_in_use');
  });

  it('login com senha errada retorna 401 sem revelar se o e-mail existe', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'senha-correta' });

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@x.com', password: 'senha-errada' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nunca-existiu@x.com', password: 'qualquer' });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('invalid_credentials');
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.code).toBe('invalid_credentials');
  });

  it('login, me, refresh e logout controlam a sessão de ponta a ponta', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'senha-muito-segura' });

    const agent = request.agent(app);

    const login = await agent.post('/api/v1/auth/login').send({ email: 'ana@x.com', password: 'senha-muito-segura' });
    expect(login.status).toBe(200);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('ana@x.com');

    const refresh = await agent.post('/api/v1/auth/refresh');
    expect(refresh.status).toBe(200);

    await agent.post('/api/v1/auth/logout');
    const meAfterLogout = await agent.get('/api/v1/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });

  it('aceita Authorization: Bearer além do cookie', async () => {
    const register = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'senha-muito-segura' });

    const cookies = register.headers['set-cookie'] as unknown as string[];
    const accessToken = cookies.find((c) => c.startsWith('access_token='))!.split(';')[0]!.split('=')[1];

    const withToken = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(withToken.status).toBe(200);

    const withBadToken = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer token-adulterado');
    expect(withBadToken.status).toBe(401);
  });

  it('bloqueia com 429 após muitas tentativas nas rotas de auth', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@x.com', password: 'senha-muito-segura' });

    let last;
    for (let i = 0; i < 20; i++) {
      last = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ana@x.com', password: 'senha-errada' });
      if (last.status === 429) break;
    }

    expect(last!.status).toBe(429);
    expect(last!.body.error.code).toBe('rate_limited');
  });
});
