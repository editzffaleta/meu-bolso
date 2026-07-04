'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listAccounts, AccountsApiError } from '@/modules/accounts/util/accounts-api.util';
import type { Account } from '@/modules/accounts/types/account.type';
import { listCategories, CategoriesApiError } from '@/modules/categories/util/categories-api.util';
import type { Category } from '@/modules/categories/types/category.type';
import { TransactionFiltersBar } from '@/modules/transactions/components/transaction-filters-bar.component';
import { TransactionFormDialog } from '@/modules/transactions/components/transaction-form-dialog.component';
import { TransactionRow } from '@/modules/transactions/components/transaction-row.component';
import {
  DEFAULT_PAGE_SIZE,
  type Transaction,
  type TransactionFilters,
  type TransactionFormValues,
} from '@/modules/transactions/types/transaction.type';
import {
  TransactionsApiError,
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '@/modules/transactions/util/transactions-api.util';

const EMPTY_FILTERS: TransactionFilters = {
  from: '',
  to: '',
  accountId: '',
  categoryId: '',
  type: '',
};

function reportApiErrors(error: unknown) {
  if (
    error instanceof TransactionsApiError ||
    error instanceof AccountsApiError ||
    error instanceof CategoriesApiError
  ) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function TransactionsComponent() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionPendingDeletion, setTransactionPendingDeletion] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReferenceData = useCallback(async () => {
    if (!token) return;

    try {
      const [accountsData, categoriesData] = await Promise.all([
        listAccounts(token),
        listCategories(token),
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (error) {
      reportApiErrors(error);
    }
  }, [token]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const result = await listTransactions(token, {
        ...filters,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setTransactions(result.items);
      setTotal(result.total);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token, filters, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadTransactions();
  }, [loadTransactions]);

  function handleFiltersChange(nextFilters: TransactionFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleOpenCreate() {
    setEditingTransaction(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: TransactionFormValues) {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const payload = {
        date: values.date,
        description: values.description,
        type: values.type,
        amount: Number(values.amount),
        accountId: values.accountId,
        categoryId: values.categoryId ? values.categoryId : undefined,
      };

      if (editingTransaction) {
        await updateTransaction(token, editingTransaction.id, payload);
        toast.success('Transação atualizada com sucesso!');
      } else {
        await createTransaction(token, payload);
        toast.success('Transação criada com sucesso!');
      }

      setIsFormOpen(false);
      await loadTransactions();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !transactionPendingDeletion) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(token, transactionPendingDeletion.id);
      toast.success('Transação excluída com sucesso!');
      setTransactionPendingDeletion(null);
      await loadTransactions();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Transações"
        title="Transações"
        subtitle="Acompanhe receitas e despesas da sua conta"
        aside={
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Nova transação
          </Button>
        }
      />

      <TransactionFiltersBar
        filters={filters}
        accounts={accounts}
        categories={categories}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {isLoading ? (
        <TransactionsSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyTransactionsState onCreate={handleOpenCreate} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  account={accounts.find((account) => account.id === transaction.accountId)}
                  category={categories.find((category) => category.id === transaction.categoryId)}
                  onEdit={handleOpenEdit}
                  onDelete={setTransactionPendingDeletion}
                />
              ))}
            </TableBody>
          </Table>

          <div className="border-t border-border p-4">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={total}
              totalLabel="transações"
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      <TransactionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(transactionPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setTransactionPendingDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir transação"
        description="Esta ação remove a transação selecionada de forma permanente."
        itemLabel="Transação"
        itemValue={transactionPendingDeletion?.description}
        isConfirming={isDeleting}
      />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border" aria-busy="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`transaction-skeleton-${index}`}
          className="h-16 animate-pulse border-b border-border bg-muted/40 last:border-b-0"
        />
      ))}
    </div>
  );
}

function EmptyTransactionsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
        <Receipt className="size-8 text-primary" />
      </span>
      <div className="space-y-1">
        <h3 className="text-lg font-bold">Nenhuma transação encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Crie sua primeira transação para começar a acompanhar suas finanças.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Nova transação
      </Button>
    </div>
  );
}
