'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { AccountCard } from '@/modules/accounts/components/account-card.component';
import { AccountFormDialog } from '@/modules/accounts/components/account-form-dialog.component';
import type { Account, AccountFormValues } from '@/modules/accounts/types/account.type';
import {
  AccountsApiError,
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from '@/modules/accounts/util/accounts-api.util';

function reportApiErrors(error: unknown) {
  if (error instanceof AccountsApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function AccountsComponent() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountPendingDeletion, setAccountPendingDeletion] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await listAccounts(token);
      setAccounts(data);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadAccounts();
  }, [loadAccounts]);

  function handleOpenCreate() {
    setEditingAccount(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(account: Account) {
    setEditingAccount(account);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: AccountFormValues) {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        type: values.type,
        institution: values.institution.trim() ? values.institution.trim() : undefined,
        initialBalance: Number(values.initialBalance),
      };

      if (editingAccount) {
        await updateAccount(token, editingAccount.id, payload);
        toast.success('Conta atualizada com sucesso!');
      } else {
        await createAccount(token, payload);
        toast.success('Conta criada com sucesso!');
      }

      setIsFormOpen(false);
      await loadAccounts();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !accountPendingDeletion) return;

    setIsDeleting(true);
    try {
      await deleteAccount(token, accountPendingDeletion.id);
      toast.success('Conta excluída com sucesso!');
      setAccountPendingDeletion(null);
      await loadAccounts();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Contas"
        title="Contas"
        subtitle="Suas contas e saldos"
        aside={
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Nova conta
          </Button>
        }
      />

      {isLoading ? (
        <AccountsSkeleton />
      ) : accounts.length === 0 ? (
        <EmptyAccountsState onCreate={handleOpenCreate} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleOpenEdit}
              onDelete={setAccountPendingDeletion}
            />
          ))}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-7" />
            <span className="text-sm font-semibold">Adicionar conta</span>
          </button>
        </div>
      )}

      <AccountFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        account={editingAccount}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(accountPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setAccountPendingDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir conta"
        description="Esta ação remove a conta selecionada de forma permanente."
        itemLabel="Conta"
        itemValue={accountPendingDeletion?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`account-skeleton-${index}`}
          className="h-[180px] animate-pulse rounded-2xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

function EmptyAccountsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
        <Wallet className="size-8 text-primary" />
      </span>
      <div className="space-y-1">
        <h3 className="text-lg font-bold">Nenhuma conta cadastrada</h3>
        <p className="text-sm text-muted-foreground">
          Crie sua primeira conta para começar a organizar suas finanças.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Nova conta
      </Button>
    </div>
  );
}
