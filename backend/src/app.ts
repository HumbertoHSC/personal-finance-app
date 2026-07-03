import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { routes } from './routes/index.js';

export const app = express();

// Atrás do proxy do Render/Railway; sem isso o rate limit por IP veria só o IP do proxy
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: 'Recurso não encontrado.' },
  });
});

app.use(errorHandler);
