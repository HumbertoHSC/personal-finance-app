declare global {
  namespace Express {
    interface Request {
      /** id do usuário autenticado, preenchido pelo middleware ensureAuthenticated */
      userId?: string;
    }
  }
}

export {};
