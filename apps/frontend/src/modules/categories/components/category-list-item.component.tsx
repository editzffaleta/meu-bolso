'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { LucideIconByKey } from '@/shared/components/ui/lucide-icon-by-key';
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

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 transition-colors hover:bg-muted/40">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: hexToSoftBackground(category.color) }}
      >
        <LucideIconByKey name={category.icon} size={20} iconColor={category.color} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{category.name}</div>
        {category.isDefault ? (
          <div className="mt-0.5 text-xs text-muted-foreground">Categoria padrão</div>
        ) : null}
      </div>

      <span
        className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
          isIncome
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-rose-500/10 text-rose-500'
        }`}
      >
        {categoryTypeLabel(category.type)}
      </span>

      <button
        type="button"
        onClick={() => onEdit(category)}
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-primary"
        aria-label={`Editar ${category.name}`}
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(category)}
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-destructive"
        aria-label={`Excluir ${category.name}`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
