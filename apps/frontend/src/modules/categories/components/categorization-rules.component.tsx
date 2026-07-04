'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
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
      toast.success(
        `${result.categorized} de ${result.evaluated} transações foram categorizadas.`,
      );
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-bold">Regras de categorização automática</div>
          <Button size="sm" variant="secondary" onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Nova regra
          </Button>
        </div>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          Transações cuja descrição contém a palavra-chave são categorizadas automaticamente.
        </p>
      </div>

      {isLoading ? (
        <RulesSkeleton />
      ) : rules.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
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

      <div className="p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleRecategorize}
          disabled={isRecategorizing}
        >
          {isRecategorizing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          {isRecategorizing ? 'Recategorizando...' : 'Recategorizar transações agora'}
        </Button>
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
          className="h-14 animate-pulse border-b border-border bg-muted/40 last:border-b-0"
        />
      ))}
    </div>
  );
}
