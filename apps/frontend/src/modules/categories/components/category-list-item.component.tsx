'use client';

import { Icon } from '@/shared/components/ui/icon';
import { categoryTypeLabel, type Category } from '@/modules/categories/types/category.type';

type CategoryListItemProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
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

export function CategoryListItem({ category, onEdit, onDelete }: CategoryListItemProps) {
  const isIncome = category.type === 'income';
  const typeColor = isIncome ? '#059669' : '#dc2626';
  const typeBg = isIncome ? 'rgba(5,150,105,.12)' : 'rgba(220,38,38,.12)';

  return (
    <div
      data-testid="categories-list-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '13px 20px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: hexToSoftBackground(category.color),
        }}
      >
        <Icon name={category.icon ?? 'category'} size={20} color={category.color} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{category.name}</div>
        {category.isDefault ? (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>Categoria padrão</div>
        ) : null}
      </div>

      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          color: typeColor,
          background: typeBg,
        }}
      >
        {categoryTypeLabel(category.type)}
      </span>

      <button
        type="button"
        onClick={() => onEdit(category)}
        aria-label={`Editar ${category.name}`}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: 'none',
          background: 'none',
          color: 'var(--text-faint)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="edit" size={17} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(category)}
        aria-label={`Excluir ${category.name}`}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: 'none',
          background: 'none',
          color: 'var(--text-faint)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="delete" size={17} />
      </button>
    </div>
  );
}
