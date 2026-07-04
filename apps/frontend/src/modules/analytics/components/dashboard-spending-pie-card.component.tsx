import { PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PieBreakdownChart } from '@/shared/components/ui/pie-breakdown-chart';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { SpendingByCategoryOut } from '@/modules/analytics/types/analytics.type';

type DashboardSpendingPieCardProps = {
  items: SpendingByCategoryOut[];
  isLoading: boolean;
};

export function DashboardSpendingPieCard({ items, isLoading }: DashboardSpendingPieCardProps) {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="relative overflow-hidden border-white/10 bg-linear-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-lg font-semibold text-zinc-50">Gastos por categoria</CardTitle>
        <p className="text-sm text-zinc-400">Distribuição das despesas no mês selecionado</p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        ) : (
          <>
            <PieBreakdownChart
              data={items.map((item) => ({
                label: item.name,
                value: item.total,
                color: item.color,
              }))}
              height={280}
              showLegend={false}
              showPercentageInTooltip
              valueFormatter={formatCurrencyBRL}
              emptyState={
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                  <PieChart className="size-8 text-zinc-600" aria-hidden />
                  <p className="text-sm text-zinc-500">Nenhum gasto categorizado neste mês.</p>
                </div>
              }
            />

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const percent = total > 0 ? (item.total / total) * 100 : 0;
                  return (
                    <div
                      key={`${item.categoryId ?? 'sem-categoria'}-${item.name}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs font-semibold text-zinc-500">{percent.toFixed(1)}%</span>
                        <span className="font-mono-money text-sm font-semibold text-zinc-200">
                          {formatCurrencyBRL(item.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
