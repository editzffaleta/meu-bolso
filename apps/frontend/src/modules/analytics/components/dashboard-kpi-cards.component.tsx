import { Icon } from '@/shared/components/ui/icon';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { SummaryOut } from '@/modules/analytics/types/analytics.type';

type DashboardKpiCardsProps = {
  summary: SummaryOut | null;
  isLoading: boolean;
};

type KpiCardProps = {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  dataTestId?: string;
};

function KpiCard({ label, value, icon, iconBg, iconColor, valueColor, dataTestId }: KpiCardProps) {
  return (
    <div
      data-testid={dataTestId}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: iconBg,
          }}
        >
          <Icon name={icon} size={19} color={iconColor} />
        </span>
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono'",
          fontSize: 25,
          fontWeight: 700,
          marginTop: 12,
          letterSpacing: '-.02em',
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function DashboardKpiCards({ summary, isLoading }: DashboardKpiCardsProps) {
  if (isLoading || !summary) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            style={{
              height: 128,
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

  const isBalancePositive = summary.balance >= 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      <KpiCard
        label="Saldo"
        value={formatCurrencyBRL(summary.balance)}
        icon="account_balance_wallet"
        iconBg={isBalancePositive ? 'var(--primary-soft)' : 'rgba(220,38,38,.12)'}
        iconColor={isBalancePositive ? 'var(--primary)' : '#dc2626'}
        valueColor={isBalancePositive ? 'var(--text)' : '#dc2626'}
        dataTestId="dashboard-kpi-balance"
      />

      <KpiCard
        label="Receitas"
        value={formatCurrencyBRL(summary.totalIncome)}
        icon="trending_up"
        iconBg="var(--primary-soft)"
        iconColor="var(--primary)"
        valueColor="var(--primary)"
      />

      <KpiCard
        label="Despesas"
        value={formatCurrencyBRL(summary.totalExpense)}
        icon="trending_down"
        iconBg="rgba(220,38,38,.12)"
        iconColor="#dc2626"
        valueColor="#dc2626"
      />

      <KpiCard
        label="Transações"
        value={String(summary.transactionCount)}
        icon="receipt_long"
        iconBg="var(--surface-2)"
        iconColor="var(--text-dim)"
        valueColor="var(--text)"
      />
    </div>
  );
}
