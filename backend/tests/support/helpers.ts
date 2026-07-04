import request, { type Agent } from 'supertest';
import { app } from '../../src/app.js';

export async function registerAgent(email: string, name = 'Teste'): Promise<Agent> {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/register').send({ name, email, password: 'senha-muito-segura' });
  if (res.status !== 201) {
    throw new Error(`Falha ao registrar usuário de teste: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
}
