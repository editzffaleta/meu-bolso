export type SummaryOut = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
};

export type SpendingByCategoryOut = {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
};

export type MonthlyEvolutionOut = {
  month: string;
  income: number;
  expense: number;
};

export function currentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
