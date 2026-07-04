'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Icon } from '@/shared/components/ui/icon';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { MonthlyEvolutionOut } from '@/modules/analytics/types/analytics.type';

type DashboardEvolutionBarCardProps = {
  items: MonthlyEvolutionOut[];
  isLoading: boolean;
};

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;

  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date);
  return label.replace('.', '');
}

export function DashboardEvolutionBarCard({ items, isLoading }: DashboardEvolutionBarCardProps) {
  const hasData = items.some((item) => item.income > 0 || item.expense > 0);

  const chartData = items.map((item) => ({
    month: item.month,
    monthLabel: formatMonthLabel(item.month),
    Receita: item.income,
    Despesa: item.expense,
  }));

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: 22,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Receitas x Despesas</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
            Últimos {items.length || 6} meses
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-dim)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#059669' }} />
            Receita
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-dim)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#dc2626' }} />
            Despesa
          </div>
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            height: 320,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : !hasData ? (
        <div
          style={{
            height: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 16,
            border: '1px dashed var(--border)',
            background: 'var(--surface-2)',
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          <Icon name="bar_chart" size={32} color="var(--text-faint)" />
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>Sem dados suficientes para exibir a evolução mensal.</p>
        </div>
      ) : (
        <div style={{ height: 320, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: 'var(--text-dim)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                width={80}
                tick={{ fill: 'var(--text-dim)', fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrencyBRL(value)}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  boxShadow: 'var(--shadow-md)',
                }}
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(value, name) => [formatCurrencyBRL(Number(value ?? 0)), String(name ?? '')]}
              />
              <Bar dataKey="Receita" fill="#059669" radius={[8, 8, 4, 4]} maxBarSize={28} />
              <Bar dataKey="Despesa" fill="#dc2626" radius={[8, 8, 4, 4]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
