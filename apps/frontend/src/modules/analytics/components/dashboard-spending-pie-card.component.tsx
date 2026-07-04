'use client';

import { PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
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
      className="rounded-2xl border border-border bg-card p-[22px] shadow-[var(--shadow-card)]"
      data-testid="dashboard-chart-category"
    >
      <h3 className="mb-0.5 text-[15px] font-bold text-foreground">Gastos por categoria</h3>
      <p className="mb-3.5 text-[12.5px] text-muted-foreground">Distribuição das despesas no mês selecionado</p>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted" />
      ) : items.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/60 px-6 text-center">
          <PieChartIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum gasto categorizado neste mês.</p>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    backgroundColor: 'var(--card)',
                    color: 'var(--card-foreground)',
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
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {items.map((item, index) => (
                    <Cell key={`${item.categoryId ?? 'sem-categoria'}-${index}`} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span className="font-mono-money text-base font-bold text-foreground">{formatCurrencyBRL(total)}</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {items.map((item) => {
              const percent = total > 0 ? (item.total / total) * 100 : 0;
              return (
                <div
                  key={`${item.categoryId ?? 'sem-categoria'}-${item.name}`}
                  className="flex items-center gap-2.5 text-[12.5px]"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                  <span className="shrink-0 font-semibold text-foreground">{percent.toFixed(0)}%</span>
                  <span className="font-mono-money shrink-0 text-xs text-muted-foreground">
                    {formatCurrencyBRL(item.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
