import Link from 'next/link';
import { ArrowRight, Receipt } from 'lucide-react';
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold text-foreground">Últimas transações</h3>
        <Link
          href="/transacoes"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Ver todas
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-[22px]" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`tx-skeleton-${index}`} className="h-16 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <Receipt className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhuma transação registrada neste mês.</p>
        </div>
      ) : (
        <div>
          {transactions.map((transaction) => {
            const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
            const isIncome = transaction.type === 'income';

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3.5 border-b border-border px-[22px] py-[13px] transition-colors last:border-b-0 hover:bg-muted/60"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-[11px]"
                  style={{ backgroundColor: category ? hexToSoftBackground(category.color) : 'rgba(148,163,184,0.15)' }}
                >
                  <LucideIconByKey
                    name={category?.icon ?? null}
                    size={18}
                    iconColor={category?.color ?? '#9CA3AF'}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{transaction.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateBR(transaction.date)}</p>
                </div>

                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{
                    backgroundColor: category ? hexToSoftBackground(category.color) : 'rgba(148,163,184,0.15)',
                    color: category?.color ?? '#9CA3AF',
                  }}
                >
                  {category?.name ?? 'Sem categoria'}
                </span>

                <span
                  className={`font-mono-money w-[120px] shrink-0 text-right text-sm font-semibold ${
                    isIncome ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {isIncome ? '+ ' : '- '}
                  {formatCurrencyBRL(transaction.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
