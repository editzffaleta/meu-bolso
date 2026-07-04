'use client';

import { Icon } from '@/shared/components/ui/icon';
import { accountTypeLabel, type Account, type AccountType } from '@/modules/accounts/types/account.type';

type AccountCardProps = {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

const ACCOUNT_TYPE_VISUALS: Record<AccountType, { icon: string; color: string; tint: string }> = {
  checking: { icon: 'account_balance', color: '#2563eb', tint: '#eff6ff' },
  savings: { icon: 'savings', color: '#059669', tint: '#e7f6ef' },
  wallet: { icon: 'account_balance_wallet', color: '#d97706', tint: '#fef3e2' },
  credit: { icon: 'credit_card', color: '#7c3aed', tint: '#f3ebff' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const isNegative = account.initialBalance < 0;
  const visual = ACCOUNT_TYPE_VISUALS[account.type];

  return (
    <div
      data-testid="accounts-list-row"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            display: 'grid',
            placeItems: 'center',
            background: visual.tint,
          }}
        >
          <Icon name={visual.icon} size={24} color={visual.color} />
        </span>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => onEdit(account)}
            aria-label={`Editar ${account.name}`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: 'none',
              background: 'var(--surface-2)',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="edit" size={17} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            aria-label={`Excluir ${account.name}`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: 'none',
              background: 'var(--surface-2)',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="delete" size={17} />
          </button>
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 16 }}>{account.name}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
        {accountTypeLabel(account.type)}
        {account.institution ? ` · ${account.institution}` : ''}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 3 }}>Saldo atual</div>
        <div
          style={{
            fontFamily: "'JetBrains Mono'",
            fontSize: 22,
            fontWeight: 700,
            color: isNegative ? '#dc2626' : 'var(--text)',
          }}
        >
          {formatCurrency(account.initialBalance)}
        </div>
      </div>
    </div>
  );
}
