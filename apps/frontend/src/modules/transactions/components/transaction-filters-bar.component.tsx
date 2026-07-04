'use client';

import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { Label } from '@/shared/components/ui/label';
import type { Account } from '@/modules/accounts/types/account.type';
import type { Category } from '@/modules/categories/types/category.type';
import {
  TRANSACTION_TYPE_OPTIONS,
  type TransactionFilters,
  type TransactionType,
} from '@/modules/transactions/types/transaction.type';

type TransactionFiltersBarProps = {
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  onChange: (filters: TransactionFilters) => void;
  onClear: () => void;
};

export function TransactionFiltersBar({
  filters,
  accounts,
  categories,
  onChange,
  onClear,
}: TransactionFiltersBarProps) {
  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));
  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const typeOptions = TRANSACTION_TYPE_OPTIONS;

  const hasActiveFilters =
    filters.from || filters.to || filters.accountId || filters.categoryId || filters.type;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="min-w-[150px]">
        <Label htmlFor="filter-from">De</Label>
        <DatePickerInput
          id="filter-from"
          value={filters.from}
          onChange={(value) => onChange({ ...filters, from: value })}
          placeholder="Data inicial"
        />
      </div>

      <div className="min-w-[150px]">
        <Label htmlFor="filter-to">Até</Label>
        <DatePickerInput
          id="filter-to"
          value={filters.to}
          onChange={(value) => onChange({ ...filters, to: value })}
          placeholder="Data final"
        />
      </div>

      <div className="min-w-[180px]">
        <Label htmlFor="filter-account">Conta</Label>
        <Combobox
          options={accountOptions}
          value={filters.accountId}
          onChange={(value) => onChange({ ...filters, accountId: value })}
          placeholder="Todas as contas"
          emptyText="Nenhuma conta cadastrada."
        />
      </div>

      <div className="min-w-[180px]">
        <Label htmlFor="filter-category">Categoria</Label>
        <Combobox
          options={categoryOptions}
          value={filters.categoryId}
          onChange={(value) => onChange({ ...filters, categoryId: value })}
          placeholder="Todas as categorias"
          emptyText="Nenhuma categoria cadastrada."
        />
      </div>

      <div className="min-w-[150px]">
        <Label htmlFor="filter-type">Tipo</Label>
        <Combobox
          options={typeOptions}
          value={filters.type}
          onChange={(value) => onChange({ ...filters, type: value as TransactionType })}
          placeholder="Todos os tipos"
        />
      </div>

      {hasActiveFilters ? (
        <Button type="button" variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
