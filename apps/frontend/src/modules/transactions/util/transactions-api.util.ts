import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type {
  ListTransactionsResult,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '@/modules/transactions/types/transaction.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

export class TransactionsApiError extends Error {
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
  throw new TransactionsApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

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
  const response = await fetch(`${API_URL}/transactions${buildQueryString(params)}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as ListTransactionsResult;
}

export async function createTransaction(
  token: string,
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Transaction;
}

export async function updateTransaction(
  token: string,
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Transaction;
}

export async function deleteTransaction(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (response.status !== 204) {
    await parseErrorResponse(response);
  }
}
