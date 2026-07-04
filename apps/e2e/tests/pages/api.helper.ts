// api.helper.ts — chamadas diretas ao backend (:4000) para setup de dados
// auxiliares que nao fazem parte da jornada de UI sob teste (ex.: regra de
// categorizacao criada antes da importacao).
import type { APIRequestContext } from '@playwright/test';

const BACKEND_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';

export async function registerUser(
  request: APIRequestContext,
  data: { name: string; email: string; password: string },
) {
  const response = await request.post(`${BACKEND_URL}/auth/register`, { data });
  if (response.status() !== 201) {
    throw new Error(`Falha ao registrar usuario: ${response.status()} ${await response.text()}`);
  }
}

export async function loginUser(
  request: APIRequestContext,
  data: { email: string; password: string },
): Promise<string> {
  const response = await request.post(`${BACKEND_URL}/auth/login`, { data });
  if (response.status() !== 200) {
    throw new Error(`Falha ao logar usuario: ${response.status()} ${await response.text()}`);
  }
  const body = (await response.json()) as { token: string };
  return body.token;
}

export async function createCategory(
  request: APIRequestContext,
  token: string,
  data: { name: string; type: 'income' | 'expense'; color: string; icon?: string },
): Promise<{ id: string }> {
  const response = await request.post(`${BACKEND_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (response.status() !== 201) {
    throw new Error(`Falha ao criar categoria: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function createCategorizationRule(
  request: APIRequestContext,
  token: string,
  data: { keyword: string; categoryId: string; priority?: number },
) {
  const response = await request.post(`${BACKEND_URL}/categorization-rules`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (response.status() !== 201) {
    throw new Error(`Falha ao criar regra de categorizacao: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}
