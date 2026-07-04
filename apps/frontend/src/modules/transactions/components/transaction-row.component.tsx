'use client';

import { Icon } from '@/shared/components/ui/icon';
import type { Account } from '@/modules/accounts/types/account.type';
import type { Category } from '@/modules/categories/types/category.type';
import type { Transaction } from '@/modules/transactions/types/transaction.type';
import { formatCurrencyBRL, formatDateBR } from '@/modules/transactions/util/format-currency.util';

type TransactionRowProps = {
  transaction: Transaction;
  account: Account | undefined;
  category: Category | undefined;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function hexToSoftBackground(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return 'rgba(148, 163, 184, 0.15)';
  }

  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

export function TransactionRow({ transaction, account, category, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const valueColor = isIncome ? '#16a34a' : '#dc2626';
  const signedValue = `${isIncome ? '+' : '-'} ${formatCurrencyBRL(transaction.amount)}`;
  const isManual = transaction.source === 'manual';
  const categoryColor = category?.color ?? '#94a3b8';

  return (
    <div
      data-testid="transactions-table-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '92px 1fr 150px 140px 130px 130px',
        gap: 12,
        padding: '14px 22px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: 'var(--text-dim)' }}>
        {formatDateBR(transaction.date)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            background: hexToSoftBackground(categoryColor),
          }}
        >
          <Icon name={category?.icon ?? 'category'} size={18} color={categoryColor} />
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {transaction.description}
        </span>
      </div>

      <div>
        {category ? (
          <span
            data-testid="transaction-category-badge"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 20,
              color: categoryColor,
              background: hexToSoftBackground(categoryColor),
            }}
          >
            {category.name}
          </span>
        ) : (
          <span
            data-testid="transaction-category-badge"
            style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)' }}
          >
            Sem categoria
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{account?.name ?? '—'}</div>

      <div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11.5,
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: 6,
            color: isManual ? '#0284c7' : '#7c3aed',
            background: isManual ? 'rgba(2,132,199,.12)' : 'rgba(124,58,237,.12)',
          }}
        >
          <Icon name={isManual ? 'edit_note' : 'upload_file'} size={14} />
          {isManual ? 'Manual' : 'Importada'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600, color: valueColor }}>
          {signedValue}
        </span>
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label={`Editar ${transaction.description}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: 'none',
            background: 'none',
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
          onClick={() => onDelete(transaction)}
          aria-label={`Excluir ${transaction.description}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: 'none',
            background: 'none',
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
  );
}
