import { z } from 'zod';

// trim/lowercase antes da validação de formato, para aceitar " Ana@X.com "
const emailSchema = z.string().trim().toLowerCase().pipe(z.email('E-mail inválido'));

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome precisa ter pelo menos 2 caracteres'),
  email: emailSchema,
  // bcrypt considera no máximo 72 bytes; limitar evita falsa sensação de segurança
  password: z
    .string()
    .min(8, 'Senha precisa ter pelo menos 8 caracteres')
    .max(72, 'Senha pode ter no máximo 72 caracteres'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
