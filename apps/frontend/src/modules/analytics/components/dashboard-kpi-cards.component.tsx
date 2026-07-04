import { ArrowDownCircle, ArrowUpCircle, ListChecks, Wallet } from 'lucide-react';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { SummaryOut } from '@/modules/analytics/types/analytics.type';

type DashboardKpiCardsProps = {
  summary: SummaryOut | null;
  isLoading: boolean;
};

export function DashboardKpiCards({ summary, isLoading }: DashboardKpiCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  const isBalancePositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Saldo"
        subtitle="Receitas - despesas no mês"
        value={formatCurrencyBRL(summary.balance)}
        icon={<Wallet />}
        valueClassName={`font-mono-money text-2xl md:text-3xl font-black tracking-tight ${
          isBalancePositive ? 'text-emerald-400' : 'text-rose-400'
        }`}
        iconColorClassName={isBalancePositive ? 'text-emerald-400' : 'text-rose-400'}
        data-testid="dashboard-kpi-balance"
      />

      <MetricCard
        title="Receitas"
        subtitle="Total de entradas no mês"
        value={formatCurrencyBRL(summary.totalIncome)}
        icon={<ArrowUpCircle />}
        valueClassName="font-mono-money text-2xl md:text-3xl font-black tracking-tight text-emerald-400"
        iconColorClassName="text-emerald-400"
      />

      <MetricCard
        title="Despesas"
        subtitle="Total de saídas no mês"
        value={formatCurrencyBRL(summary.totalExpense)}
        icon={<ArrowDownCircle />}
        valueClassName="font-mono-money text-2xl md:text-3xl font-black tracking-tight text-rose-400"
        iconColorClassName="text-rose-400"
      />

      <MetricCard
        title="Transações"
        subtitle="Quantidade lançada no mês"
        value={summary.transactionCount}
        icon={<ListChecks />}
        valueClassName="font-mono-money text-2xl md:text-3xl font-black tracking-tight text-zinc-100"
        iconColorClassName="text-sky-400"
      />
    </div>
  );
}
