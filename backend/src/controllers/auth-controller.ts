import type { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { AppError } from '../lib/app-error.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../lib/auth-cookies.js';
import { verifyRefreshToken } from '../lib/jwt.js';
import { userRepository } from '../repositories/user-repository.js';
import { loginSchema, registerSchema } from '../schemas/auth-schemas.js';
import { authService } from '../services/auth-service.js';

// passwordHash nunca sai da API
function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

const SESSION_EXPIRED = () =>
  new AppError('unauthorized', 'Sessão expirada. Faça login novamente.', 401);

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    setAuthCookies(res, user.id); // já entra logado após o cadastro
    res.status(201).json({ data: { user: toPublicUser(user) } });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const user = await authService.login(input);
    setAuthCookies(res, user.id);
    res.json({ data: { user: toPublicUser(user) } });
  },

  async refresh(req: Request, res: Response) {
    const token: string | undefined = req.cookies[REFRESH_COOKIE];
    if (!token) throw SESSION_EXPIRED();

    let userId: string;
    try {
      userId = verifyRefreshToken(token).sub;
    } catch {
      throw SESSION_EXPIRED();
    }

    const user = await userRepository.findById(userId);
    if (!user) throw SESSION_EXPIRED();

    setAuthCookies(res, user.id); // rotaciona access e refresh tokens
    res.json({ data: { user: toPublicUser(user) } });
  },

  async logout(_req: Request, res: Response) {
    clearAuthCookies(res);
    res.status(204).end();
  },

  async me(req: Request, res: Response) {
    const user = await userRepository.findById(req.userId!);
    if (!user) throw SESSION_EXPIRED();
    res.json({ data: { user: toPublicUser(user) } });
  },
};
