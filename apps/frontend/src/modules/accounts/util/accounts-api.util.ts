import { apiRequest } from '@/shared/util/http-client.util';
import type { Account, AccountType } from '@/modules/accounts/types/account.type';

export type CreateAccountPayload = {
  name: string;
  type: AccountType;
  institution?: string;
  initialBalance: number;
};

export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export async function listAccounts(token: string): Promise<Account[]> {
  return apiRequest<Account[]>('/accounts', { method: 'GET', token, expectedStatus: 200 });
}

export async function createAccount(token: string, payload: CreateAccountPayload): Promise<Account> {
  return apiRequest<Account>('/accounts', {
    method: 'POST',
    token,
    body: payload,
    expectedStatus: 201,
  });
}

export async function updateAccount(
  token: string,
  id: string,
  payload: UpdateAccountPayload,
): Promise<Account> {
  return apiRequest<Account>(`/accounts/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
    expectedStatus: 200,
  });
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await apiRequest<void>(`/accounts/${id}`, { method: 'DELETE', token, expectedStatus: 204 });
}
