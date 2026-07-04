'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listAccounts } from '@/modules/accounts/util/accounts-api.util';
import type { Account } from '@/modules/accounts/types/account.type';
import { listCategories } from '@/modules/categories/util/categories-api.util';
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
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '@/modules/transactions/util/transactions-api.util';
import { ApiError } from '@/shared/util/http-client.util';

const EMPTY_FILTERS: TransactionFilters = {
  from: '',
  to: '',
  accountId: '',
  categoryId: '',
  type: '',
};

function reportApiErrors(error: unknown) {
  if (error instanceof ApiError) {
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

  const loadTransactions = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;

      setIsLoading(true);
      try {
        const result = await listTransactions(
          token,
          {
            ...filters,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          },
          signal,
        );
        setTransactions(result.items);
        setTotal(result.total);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        reportApiErrors(error);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [token, filters, page],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento de dados via API externa a cada troca de filtros/página
    loadTransactions(controller.signal);
    return () => controller.abort();
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

      if (transactions.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadTransactions();
      }
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .35s ease' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
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
          Nova transação
        </button>
      </div>

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
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr 150px 140px 130px 130px',
              gap: 12,
              padding: '13px 22px',
              borderBottom: '1px solid var(--border)',
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              background: 'var(--surface-2)',
            }}
          >
            <div>Data</div>
            <div>Descrição</div>
            <div>Categoria</div>
            <div>Conta</div>
            <div>Origem</div>
            <div style={{ textAlign: 'right' }}>Valor</div>
          </div>

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 22px',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{total} transações</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-faint)',
                  cursor: page <= 1 ? 'default' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                <Icon name="chevron_left" size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${pageNumber === page ? 'var(--primary)' : 'var(--border)'}`,
                    background: pageNumber === page ? 'var(--primary)' : 'var(--surface)',
                    color: pageNumber === page ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-faint)',
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
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
    <div
      style={{
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`transaction-skeleton-${index}`}
          style={{
            height: 64,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

function EmptyTransactionsState({ onCreate }: { onCreate: () => void }) {
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
        <Icon name="search_off" size={32} color="var(--primary)" />
      </span>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nenhuma transação encontrada</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Crie sua primeira transação para começar a acompanhar suas finanças.
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
        Nova transação
      </button>
    </div>
  );
}
