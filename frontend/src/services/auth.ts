import { api } from './api';
import type { User } from '../types/api';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async login(payload: LoginPayload): Promise<User> {
    const { data } = await api<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await api<null>('/auth/logout', { method: 'POST' });
  },

  async me(): Promise<User> {
    const { data } = await api<{ user: User }>('/auth/me');
    return data.user;
  },
};
