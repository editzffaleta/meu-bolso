'use client';

import { useCallback, useEffect, useState } from 'react';
import { PiggyBank, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listCategories } from '@/modules/categories/util/categories-api.util';
import type { Category } from '@/modules/categories/types/category.type';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import { BudgetFormDialog } from '@/modules/budgets/components/budget-form-dialog.component';
import { BudgetProgressCard } from '@/modules/budgets/components/budget-progress-card.component';
import type { Budget, BudgetFormValues, BudgetProgress } from '@/modules/budgets/types/budget.type';
import { currentMonth } from '@/modules/budgets/types/budget.type';
import {
  BudgetsApiError,
  createBudget,
  deleteBudget,
  getBudgetsProgress,
  listBudgets,
  updateBudget,
} from '@/modules/budgets/util/budgets-api.util';

function reportApiErrors(error: unknown) {
  if (error instanceof BudgetsApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function BudgetsComponent() {
  const { token } = useAuth();
  const [month, setMonth] = useState<string>(() => currentMonth());
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [progress, setProgress] = useState<BudgetProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetPendingDeletion, setBudgetPendingDeletion] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const [categoriesData, budgetsData, progressData] = await Promise.all([
        listCategories(token),
        listBudgets(token, month),
        getBudgetsProgress(token, month),
      ]);

      setCategories(categoriesData);
      setBudgets(budgetsData);
      setProgress(progressData);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadData();
  }, [loadData]);

  function handleOpenCreate() {
    setEditingBudget(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(budget: Budget) {
    setEditingBudget(budget);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: BudgetFormValues) {
    if (!token) return;

    const limitAmount = Number(values.limitAmount);
    if (!values.categoryId || !values.month || Number.isNaN(limitAmount)) {
      toast.error(getMessage('INVALID_VALUE'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        categoryId: values.categoryId,
        month: values.month,
        limitAmount,
      };

      if (editingBudget) {
        await updateBudget(token, editingBudget.id, payload);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await createBudget(token, payload);
        toast.success('Orçamento criado com sucesso!');
      }

      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !budgetPendingDeletion) return;

    setIsDeleting(true);
    try {
      await deleteBudget(token, budgetPendingDeletion.id);
      toast.success('Orçamento excluído com sucesso!');
      setBudgetPendingDeletion(null);
      await loadData();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  function categoryById(categoryId: string): Category | undefined {
    return categories.find((category) => category.id === categoryId);
  }

  function progressByCategory(categoryId: string): BudgetProgress | undefined {
    return progress.find((item) => item.categoryId === categoryId);
  }

  const budgetPendingDeletionCategory = budgetPendingDeletion
    ? categoryById(budgetPendingDeletion.categoryId)
    : null;

  const totalLimit = progress.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = progress.reduce((sum, item) => sum + item.spent, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Orçamentos"
        title="Orçamentos"
        subtitle="Planeje quanto pretende gastar por categoria em cada mês"
        aside={
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Novo orçamento
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="budgets-month">Mês</Label>
          <Input
            id="budgets-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-44"
          />
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Orçado no mês</div>
          <div className="mt-1 font-mono text-lg font-bold">{formatCurrencyBRL(totalLimit)}</div>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Gasto até agora</div>
          <div className="mt-1 font-mono text-lg font-bold text-primary">{formatCurrencyBRL(totalSpent)}</div>
        </div>
      </div>

      {isLoading ? (
        <BudgetsSkeleton />
      ) : budgets.length === 0 ? (
        <EmptyBudgetsState onCreate={handleOpenCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetProgressCard
              key={budget.id}
              budget={budget}
              category={categoryById(budget.categoryId)}
              progress={progressByCategory(budget.categoryId)}
              onEdit={handleOpenEdit}
              onDelete={setBudgetPendingDeletion}
            />
          ))}
        </div>
      )}

      <BudgetFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        budget={editingBudget}
        categories={categories}
        month={month}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(budgetPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setBudgetPendingDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir orçamento"
        description="Esta ação remove o orçamento selecionado de forma permanente."
        itemLabel="Categoria"
        itemValue={budgetPendingDeletionCategory?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}

function BudgetsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`budget-skeleton-${index}`}
          className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

function EmptyBudgetsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
        <PiggyBank className="size-8 text-primary" />
      </span>
      <div className="space-y-1">
        <h3 className="text-lg font-bold">Nenhum orçamento definido</h3>
        <p className="text-sm text-muted-foreground">
          Defina um limite mensal por categoria para acompanhar seus gastos.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Novo orçamento
      </Button>
    </div>
  );
}
