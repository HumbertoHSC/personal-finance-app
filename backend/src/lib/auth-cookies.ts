import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  signRefreshToken,
} from './jwt.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

// Refresh token só viaja para as rotas de auth, nunca para o resto da API
const REFRESH_PATH = '/api/v1/auth';

// Secure exige HTTPS; em dev (http://localhost) o cookie não seria salvo
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export function setAuthCookies(res: Response, userId: string): void {
  res.cookie(ACCESS_COOKIE, signAccessToken(userId), {
    ...baseOptions,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken(userId), {
    ...baseOptions,
    path: REFRESH_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: REFRESH_PATH });
}
