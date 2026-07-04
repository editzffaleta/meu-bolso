'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import type { Account } from '@/modules/accounts/types/account.type';
import type { Category } from '@/modules/categories/types/category.type';
import {
  TRANSACTION_TYPE_OPTIONS,
  type Transaction,
  type TransactionFormValues,
  type TransactionType,
} from '@/modules/transactions/types/transaction.type';

type TransactionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: TransactionFormValues) => void;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: TransactionFormValues = {
  date: todayIsoDate(),
  description: '',
  type: 'expense',
  amount: '',
  accountId: '',
  categoryId: '',
};

function transactionToFormValues(transaction: Transaction | null): TransactionFormValues {
  if (!transaction) return EMPTY_FORM;

  return {
    date: transaction.date.slice(0, 10),
    description: transaction.description,
    type: transaction.type,
    amount: String(transaction.amount),
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? '',
  };
}

export function TransactionFormDialog(props: TransactionFormDialogProps) {
  if (!props.open) {
    return <Dialog open={props.open} onOpenChange={props.onOpenChange} />;
  }

  return <TransactionFormDialogContent key={props.transaction?.id ?? 'new'} {...props} />;
}

function TransactionFormDialogContent({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  isSubmitting,
  onSubmit,
}: TransactionFormDialogProps) {
  const [values, setValues] = useState<TransactionFormValues>(() => transactionToFormValues(transaction));
  const isEditing = Boolean(transaction);

  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));
  const categoryOptions = categories
    .filter((category) => category.type === values.type)
    .map((category) => ({ value: category.id, label: category.name }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title={isEditing ? 'Editar transação' : 'Nova transação'}
        description="Informe os dados da transação."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="transaction-form" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar transação'}
            </Button>
          </>
        }
      >
        <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="transaction-description">Descrição</Label>
            <Input
              id="transaction-description"
              name="description"
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction-date">Data</Label>
              <DatePickerInput
                id="transaction-date"
                value={values.date}
                onChange={(value) => setValues((current) => ({ ...current, date: value }))}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="transaction-amount">Valor</Label>
              <Input
                id="transaction-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                className="font-mono-money"
                value={values.amount}
                onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction-type">Tipo</Label>
              <Combobox
                options={TRANSACTION_TYPE_OPTIONS}
                value={values.type}
                onChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    type: value as TransactionType,
                    categoryId: '',
                  }))
                }
                placeholder="Selecione o tipo"
              />
            </div>

            <div>
              <Label htmlFor="transaction-account">Conta</Label>
              <Combobox
                options={accountOptions}
                value={values.accountId}
                onChange={(value) => setValues((current) => ({ ...current, accountId: value }))}
                placeholder="Selecione a conta"
                emptyText="Nenhuma conta cadastrada."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="transaction-category">Categoria (opcional)</Label>
            <Combobox
              options={categoryOptions}
              value={values.categoryId}
              onChange={(value) => setValues((current) => ({ ...current, categoryId: value }))}
              placeholder="Selecione a categoria"
              emptyText="Nenhuma categoria compatível."
            />
          </div>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
}
