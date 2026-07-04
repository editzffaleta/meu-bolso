'use client';

import { X } from 'lucide-react';
import type { Category } from '@/modules/categories/types/category.type';
import type { CategorizationRule } from '@/modules/categories/types/categorization-rule.type';

type CategorizationRuleListItemProps = {
  rule: CategorizationRule;
  category: Category | undefined;
  onDelete: (rule: CategorizationRule) => void;
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

export function CategorizationRuleListItem({ rule, category, onDelete }: CategorizationRuleListItemProps) {
  const color = category?.color ?? '#94a3b8';
  const name = category?.name ?? 'Categoria removida';

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 transition-colors hover:bg-muted/40">
      <span className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-[13px] font-semibold">
        {rule.keyword}
      </span>
      <span className="text-muted-foreground">&rarr;</span>
      <span
        className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] font-semibold"
        style={{ color, backgroundColor: hexToSoftBackground(color) }}
      >
        <span className="size-2 rounded-sm" style={{ backgroundColor: color }} />
        {name}
      </span>

      <button
        type="button"
        onClick={() => onDelete(rule)}
        className="ml-auto grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
        aria-label={`Excluir regra ${rule.keyword}`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
