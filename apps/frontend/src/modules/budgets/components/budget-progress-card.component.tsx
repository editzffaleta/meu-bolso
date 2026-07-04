'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { LucideIconByKey } from '@/shared/components/ui/lucide-icon-by-key';
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
  return '#059669';
}

function statusBadgeBackground(percent: number): string {
  if (percent > 100) return 'rgba(220, 38, 38, 0.12)';
  if (percent >= 80) return 'rgba(217, 119, 6, 0.12)';
  return 'rgba(5, 150, 105, 0.12)';
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
  const badgeBg = statusBadgeBackground(percent);
  const barWidth = Math.min(percent, 100);
  const categoryName = category?.name ?? 'Categoria';
  const categoryColor = category?.color ?? '#94a3b8';

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: hexToSoftBackground(categoryColor) }}
        >
          <LucideIconByKey name={category?.icon ?? null} size={21} iconColor={categoryColor} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold">{categoryName}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{statusLabel(percent)}</div>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ color, backgroundColor: badgeBg }}
        >
          {percent}%
        </span>
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-primary"
          aria-label={`Editar orçamento de ${categoryName}`}
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(budget)}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-destructive"
          aria-label={`Excluir orçamento de ${categoryName}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="h-2.5 overflow-hidden rounded-md bg-muted">
        <div
          className="h-full rounded-md transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold" style={{ color }}>
          {formatCurrencyBRL(spent)}
        </span>
        <span className="font-mono text-[13px] text-muted-foreground">de {formatCurrencyBRL(limit)}</span>
      </div>
    </div>
  );
}
