import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/app-error.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Dados inválidos.',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Rede de segurança para corridas que passam pelas checagens dos services:
  // as constraints do banco continuam valendo e viram respostas coerentes
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002' || err.code === 'P2003') {
      res.status(409).json({
        error: { code: 'conflict', message: 'Operação conflita com dados existentes.' },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: { code: 'not_found', message: 'Recurso não encontrado.' },
      });
      return;
    }
  }

  // Detalhes do erro só no log do servidor; cliente recebe mensagem genérica
  console.error(err);
  res.status(500).json({
    error: { code: 'internal_error', message: 'Erro interno do servidor.' },
  });
}
