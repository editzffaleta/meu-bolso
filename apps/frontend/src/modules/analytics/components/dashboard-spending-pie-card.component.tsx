'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Icon } from '@/shared/components/ui/icon';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { SpendingByCategoryOut } from '@/modules/analytics/types/analytics.type';

type DashboardSpendingPieCardProps = {
  items: SpendingByCategoryOut[];
  isLoading: boolean;
};

export function DashboardSpendingPieCard({ items, isLoading }: DashboardSpendingPieCardProps) {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div
      data-testid="dashboard-chart-category"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: 22,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Gastos por categoria</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14 }}>Mês selecionado</div>

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
      ) : items.length === 0 ? (
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
          <Icon name="donut_small" size={32} color="var(--text-faint)" />
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>Nenhum gasto categorizado neste mês.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  formatter={(value, name) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                    const percentage = total > 0 ? (numericValue / total) * 100 : 0;
                    return [`${formatCurrencyBRL(numericValue)} • ${percentage.toFixed(1).replace('.', ',')}%`, String(name ?? '')];
                  }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Pie
                  data={items.map((item) => ({ name: item.name, value: item.total, color: item.color }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={2}
                  cornerRadius={6}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {items.map((item, index) => (
                    <Cell key={`${item.categoryId ?? 'sem-categoria'}-${index}`} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Total</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700 }}>
                {formatCurrencyBRL(total)}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
            {items.map((item) => {
              const percent = total > 0 ? (item.total / total) * 100 : 0;
              return (
                <div
                  key={`${item.categoryId ?? 'sem-categoria'}-${item.name}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}
                >
                  <span
                    style={{ width: 9, height: 9, borderRadius: 3, background: item.color, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      flex: 1,
                      color: 'var(--text-dim)',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                  <span style={{ fontWeight: 600 }}>{percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
