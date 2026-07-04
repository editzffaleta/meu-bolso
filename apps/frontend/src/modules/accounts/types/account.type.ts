export type AccountType = 'checking' | 'savings' | 'wallet' | 'credit';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  initialBalance: number;
};

export type AccountFormValues = {
  name: string;
  type: AccountType;
  institution: string;
  initialBalance: string;
};

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'credit', label: 'Cartão de crédito' },
];

export function accountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
