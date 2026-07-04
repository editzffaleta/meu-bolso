import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type { Budget, BudgetProgress } from '@/modules/budgets/types/budget.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CreateBudgetPayload = {
  categoryId: string;
  month: string;
  limitAmount: number;
};

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export class BudgetsApiError extends Error {
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
  throw new BudgetsApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listBudgets(token: string, month?: string): Promise<Budget[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await fetch(`${API_URL}/budgets${query}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Budget[];
}

export async function getBudgetsProgress(token: string, month: string): Promise<BudgetProgress[]> {
  const response = await fetch(`${API_URL}/budgets/progress?month=${encodeURIComponent(month)}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as BudgetProgress[];
}

export async function createBudget(token: string, payload: CreateBudgetPayload): Promise<Budget> {
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Budget;
}

export async function updateBudget(
  token: string,
  id: string,
  payload: UpdateBudgetPayload,
): Promise<Budget> {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Budget;
}

export async function deleteBudget(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (response.status !== 204) {
    await parseErrorResponse(response);
  }
}
