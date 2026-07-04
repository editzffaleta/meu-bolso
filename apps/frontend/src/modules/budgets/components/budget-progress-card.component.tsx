'use client';

import { Icon } from '@/shared/components/ui/icon';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';
import type { Category } from '@/modules/categories/types/category.type';
import type { Budget, BudgetProgress } from '@/modules/budgets/types/budget.type';

type BudgetProgressCardProps = {
  budget: Budget;
  category: Category | undefined;
  progress: BudgetProgress | undefined;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
};

function hexToSoftBackground(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return 'rgba(148, 163, 184, 0.15)';
  }

  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

function statusColor(percent: number): string {
  if (percent > 100) return '#dc2626';
  if (percent >= 80) return '#d97706';
  return 'var(--primary)';
}

function statusBadgeBg(percent: number): string {
  if (percent > 100) return 'rgba(220,38,38,.12)';
  if (percent >= 80) return 'rgba(217,119,6,.12)';
  return 'var(--primary-soft)';
}

function statusIcon(percent: number): string {
  if (percent > 100) return 'error';
  if (percent >= 80) return 'warning';
  return 'check_circle';
}

function statusLabel(percent: number): string {
  if (percent > 100) return 'Orçamento estourado';
  if (percent >= 80) return 'Perto do limite';
  return 'Dentro do limite';
}

export function BudgetProgressCard({ budget, category, progress, onEdit, onDelete }: BudgetProgressCardProps) {
  const percent = progress?.percent ?? 0;
  const spent = progress?.spent ?? 0;
  const limit = progress?.limit ?? budget.limitAmount;
  const color = statusColor(percent);
  const badgeBg = statusBadgeBg(percent);
  const barWidth = Math.min(percent, 100);
  const categoryName = category?.name ?? 'Categoria';
  const categoryColor = category?.color ?? '#94a3b8';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            display: 'grid',
            placeItems: 'center',
            background: hexToSoftBackground(categoryColor),
            flexShrink: 0,
          }}
        >
          <Icon name={category?.icon ?? 'category'} size={21} color={categoryColor} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{categoryName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{statusLabel(percent)}</div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            color,
            background: badgeBg,
          }}
        >
          <Icon name={statusIcon(percent)} size={15} />
          {percent}%
        </span>
        <button
          type="button"
          onClick={() => onEdit(budget)}
          aria-label={`Editar orçamento de ${categoryName}`}
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(budget)}
          aria-label={`Excluir orçamento de ${categoryName}`}
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="delete" size={16} />
        </button>
      </div>

      <div style={{ height: 10, borderRadius: 6, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 6,
            width: `${barWidth}%`,
            background: color,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600, color }}>
          {formatCurrencyBRL(spent)}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: 'var(--text-faint)' }}>
          de {formatCurrencyBRL(limit)}
        </span>
      </div>
    </div>
  );
}
