import type { ReactNode } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ListChecks, Wallet } from 'lucide-react';
import { cn } from '@/shared/lib/class-name.util';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { SummaryOut } from '@/modules/analytics/types/analytics.type';

type DashboardKpiCardsProps = {
  summary: SummaryOut | null;
  isLoading: boolean;
};

type KpiCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconBgClassName: string;
  iconColorClassName: string;
  valueColorClassName?: string;
  'data-testid'?: string;
};

function KpiCard({ label, value, icon, iconBgClassName, iconColorClassName, valueColorClassName, 'data-testid': dataTestId }: KpiCardProps) {
  return (
    <div
      data-testid={dataTestId}
      className="rounded-2xl border border-border bg-card px-5 py-[18px] shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('grid size-[34px] shrink-0 place-items-center rounded-[10px]', iconBgClassName)}>
          <span className={cn('[&_svg]:size-[19px]', iconColorClassName)}>{icon}</span>
        </span>
      </div>
      <div
        className={cn(
          'font-mono-money mt-3 text-2xl font-bold tracking-tight text-foreground',
          valueColorClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function DashboardKpiCards({ summary, isLoading }: DashboardKpiCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="h-32 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  const isBalancePositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Saldo"
        value={formatCurrencyBRL(summary.balance)}
        icon={<Wallet />}
        iconBgClassName={isBalancePositive ? 'bg-primary-soft' : 'bg-destructive/10'}
        iconColorClassName={isBalancePositive ? 'text-primary' : 'text-destructive'}
        valueColorClassName={isBalancePositive ? 'text-primary' : 'text-destructive'}
        data-testid="dashboard-kpi-balance"
      />

      <KpiCard
        label="Receitas"
        value={formatCurrencyBRL(summary.totalIncome)}
        icon={<ArrowUpCircle />}
        iconBgClassName="bg-primary-soft"
        iconColorClassName="text-primary"
        valueColorClassName="text-primary"
      />

      <KpiCard
        label="Despesas"
        value={formatCurrencyBRL(summary.totalExpense)}
        icon={<ArrowDownCircle />}
        iconBgClassName="bg-destructive/10"
        iconColorClassName="text-destructive"
        valueColorClassName="text-destructive"
      />

      <KpiCard
        label="Transações"
        value={summary.transactionCount}
        icon={<ListChecks />}
        iconBgClassName="bg-muted"
        iconColorClassName="text-muted-foreground"
      />
    </div>
  );
}
