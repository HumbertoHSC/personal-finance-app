import bcrypt from 'bcrypt';
import { AppError } from '../lib/app-error.js';
import type { LoginInput, RegisterInput } from '../schemas/auth-schemas.js';
import { userRepository } from '../repositories/user-repository.js';

const BCRYPT_ROUNDS = 10;

// Quando o e-mail não existe, compara contra este hash mesmo assim:
// sem isso, a resposta mais rápida entregaria quais e-mails estão cadastrados
const FAKE_HASH = bcrypt.hashSync('senha-falsa-para-igualar-timing', BCRYPT_ROUNDS);

export const authService = {
  async register({ name, email, password }: RegisterInput) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('email_already_in_use', 'Este e-mail já está cadastrado.', 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return userRepository.create({ name, email, passwordHash });
  },

  async login({ email, password }: LoginInput) {
    const user = await userRepository.findByEmail(email);
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? FAKE_HASH);

    // Mensagem única para e-mail inexistente e senha errada
    if (!user || !passwordMatches) {
      throw new AppError('invalid_credentials', 'E-mail ou senha inválidos.', 401);
    }

    return user;
  },
};
