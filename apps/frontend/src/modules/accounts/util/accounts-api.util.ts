import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type { Account, AccountType } from '@/modules/accounts/types/account.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CreateAccountPayload = {
  name: string;
  type: AccountType;
  institution?: string;
  initialBalance: number;
};

export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export class AccountsApiError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join(', '));
    this.errors = errors;
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
  throw new AccountsApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listAccounts(token: string): Promise<Account[]> {
  const response = await fetch(`${API_URL}/accounts`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Account[];
}

export async function createAccount(token: string, payload: CreateAccountPayload): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Account;
}

export async function updateAccount(
  token: string,
  id: string,
  payload: UpdateAccountPayload,
): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Account;
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (response.status !== 204) {
    await parseErrorResponse(response);
  }
}
