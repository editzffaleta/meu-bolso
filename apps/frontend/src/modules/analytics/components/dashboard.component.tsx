'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getMessage } from '@/shared/i18n';
import { Icon } from '@/shared/components/ui/icon';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div />
        <label
          htmlFor="dashboard-month"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Icon name="calendar_month" size={18} color="var(--text-dim)" />
          <input
            id="dashboard-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonth())}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)' }}
          />
        </label>
      </div>

      {showGeneralEmptyState ? (
        <GeneralEmptyState />
      ) : (
        <>
          <DashboardKpiCards summary={summary} isLoading={isLoading} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <DashboardEvolutionBarCard items={monthlyEvolution} isLoading={isLoading} />
            <DashboardSpendingPieCard items={spendingByCategory} isLoading={isLoading} />
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        borderRadius: 16,
        border: '1px dashed var(--border)',
        background: 'var(--surface)',
        padding: '80px 20px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--primary-soft)',
        }}
      >
        <Icon name="auto_awesome" size={32} color="var(--primary)" />
      </span>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Comece registrando sua primeira transação</h3>
        <p style={{ maxWidth: 380, margin: '0 auto', fontSize: 14, color: 'var(--text-dim)' }}>
          Assim que você lançar receitas e despesas, seus gráficos e indicadores aparecem aqui automaticamente.
        </p>
      </div>
      <Link
        href="/transacoes"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--primary)',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13.5,
          fontWeight: 600,
          color: '#fff',
          textDecoration: 'none',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Icon name="add" size={18} />
        Nova transação
      </Link>
    </div>
  );
}
