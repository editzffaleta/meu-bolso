import { apiRequest } from '@/shared/util/http-client.util';
import type { Budget, BudgetProgress } from '@/modules/budgets/types/budget.type';

export type CreateBudgetPayload = {
  categoryId: string;
  month: string;
  limitAmount: number;
};

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export async function listBudgets(token: string, month?: string): Promise<Budget[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return apiRequest<Budget[]>(`/budgets${query}`, { method: 'GET', token, expectedStatus: 200 });
}

export async function getBudgetsProgress(token: string, month: string): Promise<BudgetProgress[]> {
  return apiRequest<BudgetProgress[]>(`/budgets/progress?month=${encodeURIComponent(month)}`, {
    method: 'GET',
    token,
    expectedStatus: 200,
  });
}

export async function createBudget(token: string, payload: CreateBudgetPayload): Promise<Budget> {
  return apiRequest<Budget>('/budgets', {
    method: 'POST',
    token,
    body: payload,
    expectedStatus: 201,
  });
}

export async function updateBudget(
  token: string,
  id: string,
  payload: UpdateBudgetPayload,
): Promise<Budget> {
  return apiRequest<Budget>(`/budgets/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
    expectedStatus: 200,
  });
}

export async function deleteBudget(token: string, id: string): Promise<void> {
  await apiRequest<void>(`/budgets/${id}`, { method: 'DELETE', token, expectedStatus: 204 });
}
