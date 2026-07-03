import { Router } from 'express';
import { authController } from '../controllers/auth-controller.js';
import { ensureAuthenticated } from '../middlewares/ensure-authenticated.js';
import { authRateLimiter } from '../middlewares/rate-limit.js';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, authController.register);
authRoutes.post('/login', authRateLimiter, authController.login);
authRoutes.post('/refresh', authRateLimiter, authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', ensureAuthenticated, authController.me);
