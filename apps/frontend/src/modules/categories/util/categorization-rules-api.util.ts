import { apiRequest } from '@/shared/util/http-client.util';
import type {
  CategorizationRule,
  RecategorizeResult,
} from '@/modules/categories/types/categorization-rule.type';

export type CreateCategorizationRulePayload = {
  keyword: string;
  categoryId: string;
  priority?: number;
};

export type UpdateCategorizationRulePayload = Partial<CreateCategorizationRulePayload>;

export async function listCategorizationRules(token: string): Promise<CategorizationRule[]> {
  return apiRequest<CategorizationRule[]>('/categorization-rules', {
    method: 'GET',
    token,
    expectedStatus: 200,
  });
}

export async function createCategorizationRule(
  token: string,
  payload: CreateCategorizationRulePayload,
): Promise<CategorizationRule> {
  return apiRequest<CategorizationRule>('/categorization-rules', {
    method: 'POST',
    token,
    body: payload,
    expectedStatus: 201,
  });
}

export async function updateCategorizationRule(
  token: string,
  id: string,
  payload: UpdateCategorizationRulePayload,
): Promise<CategorizationRule> {
  return apiRequest<CategorizationRule>(`/categorization-rules/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
    expectedStatus: 200,
  });
}

export async function deleteCategorizationRule(token: string, id: string): Promise<void> {
  await apiRequest<void>(`/categorization-rules/${id}`, {
    method: 'DELETE',
    token,
    expectedStatus: 204,
  });
}

export async function recategorizeTransactions(
  token: string,
  includeAlreadyCategorized = false,
): Promise<RecategorizeResult> {
  return apiRequest<RecategorizeResult>('/categorization-rules/recategorize', {
    method: 'POST',
    token,
    body: { includeAlreadyCategorized },
    expectedStatus: 200,
  });
}
