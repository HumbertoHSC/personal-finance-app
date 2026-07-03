import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/app-error.js';
import { ACCESS_COOKIE } from '../lib/auth-cookies.js';
import { verifyAccessToken } from '../lib/jwt.js';

// Cookie httpOnly é o caminho do navegador; Authorization: Bearer fica
// disponível para testes manuais via Postman/Insomnia.
export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken: string | undefined = req.cookies[ACCESS_COOKIE];
  const [scheme, bearerToken] = req.headers.authorization?.split(' ') ?? [];
  const token = cookieToken ?? (scheme === 'Bearer' ? bearerToken : undefined);

  if (!token) {
    throw new AppError('unauthorized', 'Autenticação necessária.', 401);
  }

  try {
    req.userId = verifyAccessToken(token).sub;
  } catch {
    throw new AppError('unauthorized', 'Token inválido ou expirado.', 401);
  }

  next();
}
