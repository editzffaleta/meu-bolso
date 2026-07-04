'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listCategories } from '@/modules/categories/util/categories-api.util';
import type { Category } from '@/modules/categories/types/category.type';
import { listTransactions } from '@/modules/transactions/util/transactions-api.util';
import type { Transaction } from '@/modules/transactions/types/transaction.type';
import {
  AnalyticsApiError,
  getMonthlyEvolution,
  getSpendingByCategory,
  getSummary,
} from '@/modules/analytics/util/analytics-api.util';
import type {
  MonthlyEvolutionOut,
  SpendingByCategoryOut,
  SummaryOut,
} from '@/modules/analytics/types/analytics.type';
import { currentMonth } from '@/modules/analytics/types/analytics.type';
import { DashboardKpiCards } from '@/modules/analytics/components/dashboard-kpi-cards.component';
import { DashboardSpendingPieCard } from '@/modules/analytics/components/dashboard-spending-pie-card.component';
import { DashboardEvolutionBarCard } from '@/modules/analytics/components/dashboard-evolution-bar-card.component';
import { DashboardRecentTransactionsCard } from '@/modules/analytics/components/dashboard-recent-transactions-card.component';

const EVOLUTION_MONTHS = 6;
const RECENT_TRANSACTIONS_LIMIT = 8;

function reportApiErrors(error: unknown) {
  if (error instanceof AnalyticsApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function DashboardComponent() {
  const { token } = useAuth();
  const [month, setMonth] = useState<string>(() => currentMonth());

  const [summary, setSummary] = useState<SummaryOut | null>(null);
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategoryOut[]>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<MonthlyEvolutionOut[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyTransactionEver, setHasAnyTransactionEver] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const [summaryData, spendingData, evolutionData, transactionsData] = await Promise.all([
        getSummary(token, month),
        getSpendingByCategory(token, month),
        getMonthlyEvolution(token, EVOLUTION_MONTHS),
        listTransactions(token, { page: 1, pageSize: RECENT_TRANSACTIONS_LIMIT }),
      ]);

      setSummary(summaryData);
      setSpendingByCategory(spendingData);
      setMonthlyEvolution(evolutionData);
      setRecentTransactions(transactionsData.items);
      setHasAnyTransactionEver(transactionsData.total > 0);

      const categoriesData = await listCategories(token);
      setCategories(categoriesData);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadData();
  }, [loadData]);

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const showGeneralEmptyState = !isLoading && hasAnyTransactionEver === false;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Acompanhe saldo, receitas, despesas e para onde seu dinheiro está indo
          </p>
        </div>

        <label
          htmlFor="dashboard-month"
          className="flex items-center gap-2 rounded-[10px] border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground"
        >
          <CalendarDays className="size-[18px] text-muted-foreground" />
          <input
            id="dashboard-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonth())}
            className="bg-transparent outline-none"
          />
        </label>
      </div>

      {showGeneralEmptyState ? (
        <GeneralEmptyState />
      ) : (
        <>
          <DashboardKpiCards summary={summary} isLoading={isLoading} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <DashboardEvolutionBarCard items={monthlyEvolution} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2">
              <DashboardSpendingPieCard items={spendingByCategory} isLoading={isLoading} />
            </div>
          </div>

          <DashboardRecentTransactionsCard
            transactions={recentTransactions}
            categoriesById={categoriesById}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}

function GeneralEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-20 text-center shadow-[var(--shadow-card)]">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft">
        <Sparkles className="size-8 text-primary" />
      </span>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Comece registrando sua primeira transação</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Assim que você lançar receitas e despesas, seus gráficos e indicadores aparecem aqui automaticamente.
        </p>
      </div>
      <Button asChild>
        <Link href="/transacoes">
          <Plus className="size-4" />
          Nova transação
        </Link>
      </Button>
    </div>
  );
}
