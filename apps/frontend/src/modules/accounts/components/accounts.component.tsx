'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .35s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleOpenCreate}
          data-testid="accounts-create-button"
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
          Nova conta
        </button>
      </div>

      {isLoading ? (
        <AccountsSkeleton />
      ) : accounts.length === 0 ? (
        <EmptyAccountsState onCreate={handleOpenCreate} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
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
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 16,
              padding: 20,
              background: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 180,
            }}
          >
            <Icon name="add_circle" size={30} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Adicionar conta</span>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`account-skeleton-${index}`}
          style={{
            height: 180,
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

function EmptyAccountsState({ onCreate }: { onCreate: () => void }) {
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
        <Icon name="account_balance_wallet" size={32} color="var(--primary)" />
      </span>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nenhuma conta cadastrada</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Crie sua primeira conta para começar a organizar suas finanças.
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
        Nova conta
      </button>
    </div>
  );
}
