'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { CategorizationRuleFormDialog } from '@/modules/categories/components/categorization-rule-form-dialog.component';
import { CategorizationRuleListItem } from '@/modules/categories/components/categorization-rule-list-item.component';
import type { Category } from '@/modules/categories/types/category.type';
import type {
  CategorizationRule,
  CategorizationRuleFormValues,
} from '@/modules/categories/types/categorization-rule.type';
import {
  CategorizationRulesApiError,
  createCategorizationRule,
  deleteCategorizationRule,
  listCategorizationRules,
  recategorizeTransactions,
} from '@/modules/categories/util/categorization-rules-api.util';

type CategorizationRulesProps = {
  categories: Category[];
};

function reportApiErrors(error: unknown) {
  if (error instanceof CategorizationRulesApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export function CategorizationRulesComponent({ categories }: CategorizationRulesProps) {
  const { token } = useAuth();
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rulePendingDeletion, setRulePendingDeletion] = useState<CategorizationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  const loadRules = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await listCategorizationRules(token);
      setRules([...data].sort((a, b) => b.priority - a.priority));
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadRules();
  }, [loadRules]);

  function handleOpenCreate() {
    setIsFormOpen(true);
  }

  async function handleSubmit(values: CategorizationRuleFormValues) {
    if (!token) return;

    if (!values.keyword.trim() || !values.categoryId) {
      toast.error(getMessage('categorization-rule.keyword.invalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      const priority = values.priority.trim() ? Number(values.priority) : undefined;

      await createCategorizationRule(token, {
        keyword: values.keyword.trim(),
        categoryId: values.categoryId,
        priority,
      });

      toast.success('Regra criada com sucesso!');
      setIsFormOpen(false);
      await loadRules();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !rulePendingDeletion) return;

    setIsDeleting(true);
    try {
      await deleteCategorizationRule(token, rulePendingDeletion.id);
      toast.success('Regra excluída com sucesso!');
      setRulePendingDeletion(null);
      await loadRules();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRecategorize() {
    if (!token) return;

    setIsRecategorizing(true);
    try {
      const result = await recategorizeTransactions(token);
      toast.success(`${result.categorized} de ${result.evaluated} transações foram categorizadas.`);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsRecategorizing(false);
    }
  }

  function categoryFor(categoryId: string): Category | undefined {
    return categories.find((category) => category.id === categoryId);
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Regras de categorização automática</div>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-line)',
              borderRadius: 9,
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
          >
            <Icon name="add" size={17} />
            Nova regra
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>
          Transações cuja descrição contém a palavra-chave são categorizadas automaticamente.
        </div>
      </div>

      {isLoading ? (
        <RulesSkeleton />
      ) : rules.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 14, color: 'var(--text-dim)' }}>
          Nenhuma regra cadastrada.
        </div>
      ) : (
        <div>
          {rules.map((rule) => (
            <CategorizationRuleListItem
              key={rule.id}
              rule={rule}
              category={categoryFor(rule.categoryId)}
              onDelete={setRulePendingDeletion}
            />
          ))}
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        <button
          type="button"
          onClick={handleRecategorize}
          disabled={isRecategorizing}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            padding: 12,
            borderRadius: 11,
            border: '1px solid var(--primary)',
            background: 'var(--surface)',
            color: 'var(--primary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: isRecategorizing ? 'default' : 'pointer',
          }}
        >
          {isRecategorizing ? (
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid var(--primary-line)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin .7s linear infinite',
              }}
            />
          ) : (
            <Icon name="bolt" size={19} />
          )}
          {isRecategorizing ? 'Recategorizando...' : 'Recategorizar transações agora'}
        </button>
      </div>

      <CategorizationRuleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(rulePendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setRulePendingDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir regra"
        description="Esta ação remove a regra de categorização selecionada de forma permanente."
        itemLabel="Palavra-chave"
        itemValue={rulePendingDeletion?.keyword}
        isConfirming={isDeleting}
      />
    </div>
  );
}

function RulesSkeleton() {
  return (
    <div aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`rule-skeleton-${index}`}
          style={{
            height: 56,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}
