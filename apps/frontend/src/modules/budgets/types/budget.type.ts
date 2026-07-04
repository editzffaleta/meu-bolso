export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  limitAmount: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BudgetProgress = {
  categoryId: string;
  limit: number;
  spent: number;
  percent: number;
};

export type BudgetFormValues = {
  categoryId: string;
  month: string;
  limitAmount: string;
};

export function currentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
