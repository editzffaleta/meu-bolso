import type { ApiErrorResponse } from '@/shared/types/api-error.type';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const AUTH_TOKEN_COOKIE = 'auth_token';
const LOGIN_PATH = '/join';

export class ApiError extends Error {
  errors: string[];

  status: number;

  constructor(errors: string[], status: number) {
    super(errors.join(', '));
    this.errors = errors;
    this.status = status;
  }
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function handleUnauthorized(): void {
  clearAuthCookie();
  if (typeof window !== 'undefined') {
    window.location.href = LOGIN_PATH;
  }
}

async function parseErrorResponse(response: Response): Promise<never> {
  let body: ApiErrorResponse | null = null;
  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    body = null;
  }

  const errorCodes = body?.errors?.length ? body.errors : ['INTERNAL_SERVER_ERROR'];

  if (response.status === 401) {
    handleUnauthorized();
  }

  throw new ApiError(errorCodes, response.status);
}

export type RequestBody = Record<string, unknown> | FormData | undefined;

export type ApiRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string;
  body?: RequestBody;
  expectedStatus?: number;
  signal?: AbortSignal;
};

function buildHeaders(token: string | undefined, body: RequestBody): HeadersInit {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const { method, token, body, expectedStatus, signal } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: buildHeaders(token, body),
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const isExpected = expectedStatus ? response.status === expectedStatus : response.ok;

  if (!isExpected) {
    await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
