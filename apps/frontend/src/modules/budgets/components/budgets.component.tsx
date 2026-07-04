'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
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
  createBudget,
  deleteBudget,
  getBudgetsProgress,
  listBudgets,
  updateBudget,
} from '@/modules/budgets/util/budgets-api.util';
import { ApiError } from '@/shared/util/http-client.util';

function reportApiErrors(error: unknown) {
  if (error instanceof ApiError) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--card-border)',
              borderRadius: 12,
              padding: '12px 18px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Orçado no mês</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 19, fontWeight: 700, marginTop: 3 }}>
              {formatCurrencyBRL(totalLimit)}
            </div>
          </div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--card-border)',
              borderRadius: 12,
              padding: '12px 18px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Gasto até agora</div>
            <div
              style={{
                fontFamily: "'JetBrains Mono'",
                fontSize: 19,
                fontWeight: 700,
                marginTop: 3,
                color: 'var(--primary)',
              }}
            >
              {formatCurrencyBRL(totalSpent)}
            </div>
          </div>
          <div>
            <label htmlFor="budgets-month" style={{ display: 'none' }}>
              Mês
            </label>
            <input
              id="budgets-month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--primary)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Icon name="add" size={19} />
          Novo orçamento
        </button>
      </div>

      {isLoading ? (
        <BudgetsSkeleton />
      ) : budgets.length === 0 ? (
        <EmptyBudgetsState onCreate={handleOpenCreate} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`budget-skeleton-${index}`}
          style={{
            height: 160,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

function EmptyBudgetsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        borderRadius: 16,
        border: '2px dashed var(--border)',
        padding: '64px 20px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--primary-soft)',
        }}
      >
        <Icon name="savings" size={32} color="var(--primary)" />
      </span>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nenhum orçamento definido</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Defina um limite mensal por categoria para acompanhar seus gastos.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--primary)',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13.5,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Icon name="add" size={19} />
        Novo orçamento
      </button>
    </div>
  );
}
