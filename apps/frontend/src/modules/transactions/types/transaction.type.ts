export type TransactionType = 'income' | 'expense';

export type TransactionSource = 'manual' | 'import';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId: string | null;
  source: TransactionSource;
  importId: string | null;
  fingerprint: string;
};

export type TransactionFormValues = {
  date: string;
  description: string;
  type: TransactionType;
  amount: string;
  accountId: string;
  categoryId: string;
};

export type TransactionFilters = {
  from: string;
  to: string;
  accountId: string;
  categoryId: string;
  type: TransactionType | '';
};

export type ListTransactionsResult = {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
};

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
];

export function transactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export const DEFAULT_PAGE_SIZE = 20;
