import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutos
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

// Access e refresh usam segredos diferentes: um refresh token nunca
// passa na verificação de access token, e vice-versa.
export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, { subject: userId, expiresIn: REFRESH_TOKEN_TTL_SECONDS });
}

function verify(token: string, secret: string): { sub: string } {
  const payload = jwt.verify(token, secret);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new jwt.JsonWebTokenError('token sem subject');
  }
  return { sub: payload.sub };
}

export function verifyAccessToken(token: string): { sub: string } {
  return verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return verify(token, env.JWT_REFRESH_SECRET);
}
