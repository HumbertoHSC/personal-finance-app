import { ApiRequestError } from '../services/api';

export function formatApiError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'validation_error' && error.details?.length) {
      return (error.details as { message: string }[]).map((d) => d.message).join(' ');
    }
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}
