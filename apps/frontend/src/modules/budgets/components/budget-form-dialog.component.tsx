'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import type { Category } from '@/modules/categories/types/category.type';
import type { Budget, BudgetFormValues } from '@/modules/budgets/types/budget.type';

type BudgetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  categories: Category[];
  month: string;
  isSubmitting: boolean;
  onSubmit: (values: BudgetFormValues) => void;
};

function budgetToFormValues(budget: Budget | null, month: string): BudgetFormValues {
  if (!budget) {
    return { categoryId: '', month, limitAmount: '' };
  }

  return {
    categoryId: budget.categoryId,
    month: budget.month,
    limitAmount: String(budget.limitAmount),
  };
}

export function BudgetFormDialog(props: BudgetFormDialogProps) {
  return <BudgetFormDialogContent key={props.budget?.id ?? `new-${props.month}`} {...props} />;
}

function BudgetFormDialogContent({
  open,
  onOpenChange,
  budget,
  categories,
  month,
  isSubmitting,
  onSubmit,
}: BudgetFormDialogProps) {
  const [values, setValues] = useState<BudgetFormValues>(() => budgetToFormValues(budget, month));
  const isEditing = Boolean(budget);

  const categoryOptions = categories
    .filter((category) => category.type === 'expense')
    .map((category) => ({ value: category.id, label: category.name }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title={isEditing ? 'Editar orçamento' : 'Novo orçamento'}
        description="Defina o limite mensal para a categoria."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="budget-form" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar orçamento'}
            </Button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="budget-category">Categoria</Label>
            <Combobox
              options={categoryOptions}
              value={values.categoryId}
              onChange={(value) => setValues((current) => ({ ...current, categoryId: value }))}
              placeholder="Selecione a categoria"
              emptyText="Nenhuma categoria de despesa encontrada."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget-month">Mês</Label>
              <Input
                id="budget-month"
                name="month"
                type="month"
                value={values.month}
                onChange={(event) => setValues((current) => ({ ...current, month: event.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="budget-limit">Limite (R$)</Label>
              <Input
                id="budget-limit"
                name="limitAmount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className="font-mono"
                value={values.limitAmount}
                onChange={(event) =>
                  setValues((current) => ({ ...current, limitAmount: event.target.value }))
                }
                required
              />
            </div>
          </div>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
}
