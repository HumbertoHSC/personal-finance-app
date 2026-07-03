import { rateLimit } from 'express-rate-limit';

// Uma instância compartilhada: register/login/refresh somam na mesma contagem por IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'rate_limited',
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      },
    });
  },
});
