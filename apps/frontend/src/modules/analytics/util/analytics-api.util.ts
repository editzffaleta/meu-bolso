import { apiRequest } from '@/shared/util/http-client.util';
import type {
  MonthlyEvolutionOut,
  SpendingByCategoryOut,
  SummaryOut,
} from '@/modules/analytics/types/analytics.type';

export async function getSummary(token: string, month: string): Promise<SummaryOut> {
  return apiRequest<SummaryOut>(`/analytics/summary?month=${encodeURIComponent(month)}`, {
    method: 'GET',
    token,
    expectedStatus: 200,
  });
}

export async function getSpendingByCategory(
  token: string,
  month: string,
): Promise<SpendingByCategoryOut[]> {
  return apiRequest<SpendingByCategoryOut[]>(
    `/analytics/spending-by-category?month=${encodeURIComponent(month)}`,
    { method: 'GET', token, expectedStatus: 200 },
  );
}

export async function getMonthlyEvolution(
  token: string,
  months = 6,
): Promise<MonthlyEvolutionOut[]> {
  return apiRequest<MonthlyEvolutionOut[]>(`/analytics/monthly-evolution?months=${months}`, {
    method: 'GET',
    token,
    expectedStatus: 200,
  });
}
