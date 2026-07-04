'use client';

import { Icon } from '@/shared/components/ui/icon';
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono'",
          fontSize: 13,
          fontWeight: 600,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          padding: '4px 10px',
          borderRadius: 7,
        }}
      >
        {rule.keyword}
      </span>
      <Icon name="arrow_forward" size={18} color="var(--text-faint)" />
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 12.5,
          fontWeight: 600,
          padding: '4px 11px',
          borderRadius: 20,
          color,
          background: hexToSoftBackground(color),
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
        {name}
      </span>

      <button
        type="button"
        onClick={() => onDelete(rule)}
        aria-label={`Excluir regra ${rule.keyword}`}
        style={{
          marginLeft: 'auto',
          width: 28,
          height: 28,
          borderRadius: 7,
          border: 'none',
          background: 'none',
          color: 'var(--text-faint)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
