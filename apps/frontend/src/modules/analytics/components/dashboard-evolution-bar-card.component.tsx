'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
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
    <div className="rounded-2xl border border-border bg-card p-[22px] shadow-[var(--shadow-card)]">
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Receitas x Despesas</h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Últimos {items.length || 6} meses</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="size-2.5 rounded-[3px] bg-success" />
            Receita
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="size-2.5 rounded-[3px] bg-destructive" />
            Despesa
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted" />
      ) : !hasData ? (
        <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/60 px-6 text-center">
          <BarChart3 className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Sem dados suficientes para exibir a evolução mensal.</p>
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                width={80}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrencyBRL(value)}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--card)',
                  color: 'var(--card-foreground)',
                  boxShadow: 'var(--shadow-md, 0 8px 22px -8px rgba(17,24,39,.14))',
                }}
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value, name) => [formatCurrencyBRL(Number(value ?? 0)), String(name ?? '')]}
              />
              <Bar dataKey="Receita" fill="var(--success)" radius={[8, 8, 4, 4]} maxBarSize={28} />
              <Bar dataKey="Despesa" fill="var(--destructive)" radius={[8, 8, 4, 4]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
