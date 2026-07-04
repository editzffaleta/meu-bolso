import Link from 'next/link';
import { Icon } from '@/shared/components/ui/icon';
import { LucideIconByKey } from '@/shared/components/ui/lucide-icon-by-key';
import type { Category } from '@/modules/categories/types/category.type';
import type { Transaction } from '@/modules/transactions/types/transaction.type';
import { formatCurrencyBRL, formatDateBR } from '@/modules/transactions/util/format-currency.util';

type DashboardRecentTransactionsCardProps = {
  transactions: Transaction[];
  categoriesById: Map<string, Category>;
  isLoading: boolean;
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

export function DashboardRecentTransactionsCard({
  transactions,
  categoriesById,
  isLoading,
}: DashboardRecentTransactionsCardProps) {
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>Últimas transações</div>
        <Link
          href="/transacoes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--primary)',
            textDecoration: 'none',
          }}
        >
          Ver todas
          <Icon name="arrow_forward" size={17} />
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 22 }} aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`tx-skeleton-${index}`}
              style={{
                height: 64,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '48px 20px',
            textAlign: 'center',
          }}
        >
          <Icon name="receipt_long" size={32} color="var(--text-faint)" />
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>Nenhuma transação registrada neste mês.</p>
        </div>
      ) : (
        <div>
          {transactions.map((transaction) => {
            const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
            const isIncome = transaction.type === 'income';
            const tint = category ? hexToSoftBackground(category.color) : 'rgba(148,163,184,0.15)';

            return (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 22px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    background: tint,
                  }}
                >
                  <LucideIconByKey
                    name={category?.icon ?? null}
                    size={18}
                    iconColor={category?.color ?? '#9CA3AF'}
                  />
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {transaction.description}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                    {formatDateBR(transaction.date)}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 20,
                    color: category?.color ?? '#9CA3AF',
                    background: tint,
                    flexShrink: 0,
                  }}
                >
                  {category?.name ?? 'Sem categoria'}
                </span>

                <div
                  style={{
                    width: 120,
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 14,
                    fontWeight: 600,
                    color: isIncome ? '#059669' : '#dc2626',
                    flexShrink: 0,
                  }}
                >
                  {isIncome ? '+ ' : '- '}
                  {formatCurrencyBRL(transaction.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
