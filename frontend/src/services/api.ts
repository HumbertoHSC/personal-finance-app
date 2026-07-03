// Client HTTP centralizado — todas as chamadas à API passam por aqui.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export interface ApiMeta {
  total: number;
  page: number;
  per_page: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown[] };
}

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown[];

  constructor(code: string, message: string, status: number, details?: unknown[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiSuccess<T>> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    credentials: 'include', // JWT viaja em cookie httpOnly, não em localStorage
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const body = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiErrorBody | null;

  if (!response.ok || body === null || 'error' in body) {
    const error =
      body && 'error' in body
        ? body.error
        : { code: 'unknown_error', message: 'Erro inesperado ao falar com a API.' };
    throw new ApiRequestError(error.code, error.message, response.status, error.details);
  }

  return body;
}
