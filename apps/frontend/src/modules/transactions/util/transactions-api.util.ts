import { apiRequest } from '@/shared/util/http-client.util';
import type {
  ListTransactionsResult,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '@/modules/transactions/types/transaction.type';

export type CreateTransactionPayload = {
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
};

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export type ListTransactionsParams = Partial<TransactionFilters> & {
  page?: number;
  pageSize?: number;
};

function buildQueryString(params: ListTransactionsParams): string {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.accountId) searchParams.set('accountId', params.accountId);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.type) searchParams.set('type', params.type);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listTransactions(
  token: string,
  params: ListTransactionsParams = {},
): Promise<ListTransactionsResult> {
  return apiRequest<ListTransactionsResult>(`/transactions${buildQueryString(params)}`, {
    method: 'GET',
    token,
    expectedStatus: 200,
  });
}

export async function createTransaction(
  token: string,
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    token,
    body: payload,
    expectedStatus: 201,
  });
}

export async function updateTransaction(
  token: string,
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
    expectedStatus: 200,
  });
}

export async function deleteTransaction(token: string, id: string): Promise<void> {
  await apiRequest<void>(`/transactions/${id}`, { method: 'DELETE', token, expectedStatus: 204 });
}
