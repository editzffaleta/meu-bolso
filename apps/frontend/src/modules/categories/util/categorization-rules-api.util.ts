import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type {
  CategorizationRule,
  RecategorizeResult,
} from '@/modules/categories/types/categorization-rule.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CreateCategorizationRulePayload = {
  keyword: string;
  categoryId: string;
  priority?: number;
};

export type UpdateCategorizationRulePayload = Partial<CreateCategorizationRulePayload>;

export class CategorizationRulesApiError extends Error {
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
  throw new CategorizationRulesApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listCategorizationRules(token: string): Promise<CategorizationRule[]> {
  const response = await fetch(`${API_URL}/categorization-rules`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as CategorizationRule[];
}

export async function createCategorizationRule(
  token: string,
  payload: CreateCategorizationRulePayload,
): Promise<CategorizationRule> {
  const response = await fetch(`${API_URL}/categorization-rules`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as CategorizationRule;
}

export async function updateCategorizationRule(
  token: string,
  id: string,
  payload: UpdateCategorizationRulePayload,
): Promise<CategorizationRule> {
  const response = await fetch(`${API_URL}/categorization-rules/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as CategorizationRule;
}

export async function deleteCategorizationRule(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/categorization-rules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (response.status !== 204) {
    await parseErrorResponse(response);
  }
}

export async function recategorizeTransactions(
  token: string,
  includeAlreadyCategorized = false,
): Promise<RecategorizeResult> {
  const response = await fetch(`${API_URL}/categorization-rules/recategorize`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ includeAlreadyCategorized }),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as RecategorizeResult;
}
