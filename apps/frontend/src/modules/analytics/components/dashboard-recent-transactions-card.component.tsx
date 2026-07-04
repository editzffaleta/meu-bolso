import Link from 'next/link';
import { ArrowRight, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
    <Card className="relative overflow-hidden border-white/10 bg-linear-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-zinc-50">Últimas transações</CardTitle>
        <Link
          href="/transacoes"
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Ver todas
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`tx-skeleton-${index}`}
                className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <Receipt className="size-8 text-zinc-600" aria-hidden />
            <p className="text-sm text-zinc-500">Nenhuma transação registrada neste mês.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
              const isIncome = transaction.type === 'income';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: category ? hexToSoftBackground(category.color) : 'rgba(148,163,184,0.15)' }}
                  >
                    <LucideIconByKey
                      name={category?.icon ?? null}
                      size={18}
                      iconColor={category?.color ?? '#9CA3AF'}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{transaction.description}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatDateBR(transaction.date)}</p>
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
                    className={`shrink-0 font-mono-money text-sm font-semibold ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrencyBRL(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
