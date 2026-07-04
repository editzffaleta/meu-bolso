'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
    <Card className="relative overflow-hidden border-white/10 bg-linear-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-lg font-semibold text-zinc-50">Receitas x Despesas</CardTitle>
        <p className="text-sm text-zinc-400">Evolução dos últimos {items.length || 6} meses</p>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        ) : !hasData ? (
          <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
            <BarChart3 className="size-8 text-zinc-600" aria-hidden />
            <p className="text-sm text-zinc-500">Sem dados suficientes para exibir a evolução mensal.</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fill: 'rgba(244,244,245,0.72)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  width={80}
                  tick={{ fill: 'rgba(244,244,245,0.6)', fontSize: 12 }}
                  tickFormatter={(value: number) => formatCurrencyBRL(value)}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(24,24,27,0.96)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(value, name) => [formatCurrencyBRL(Number(value ?? 0)), String(name ?? '')]}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '12px', color: 'rgba(244,244,245,0.72)' }}
                />
                <Bar dataKey="Receita" fill="#34d399" radius={[8, 8, 4, 4]} maxBarSize={28} />
                <Bar dataKey="Despesa" fill="#f87171" radius={[8, 8, 4, 4]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
