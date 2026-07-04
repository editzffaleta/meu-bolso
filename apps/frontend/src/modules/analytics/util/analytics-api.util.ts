import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type {
  MonthlyEvolutionOut,
  SpendingByCategoryOut,
  SummaryOut,
} from '@/modules/analytics/types/analytics.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class AnalyticsApiError extends Error {
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
  throw new AnalyticsApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getSummary(token: string, month: string): Promise<SummaryOut> {
  const response = await fetch(`${API_URL}/analytics/summary?month=${encodeURIComponent(month)}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as SummaryOut;
}

export async function getSpendingByCategory(
  token: string,
  month: string,
): Promise<SpendingByCategoryOut[]> {
  const response = await fetch(
    `${API_URL}/analytics/spending-by-category?month=${encodeURIComponent(month)}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as SpendingByCategoryOut[];
}

export async function getMonthlyEvolution(
  token: string,
  months = 6,
): Promise<MonthlyEvolutionOut[]> {
  const response = await fetch(`${API_URL}/analytics/monthly-evolution?months=${months}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as MonthlyEvolutionOut[];
}
