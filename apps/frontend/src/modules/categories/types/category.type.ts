export type CategoryType = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
  isDefault: boolean;
};

export type CategoryFormValues = {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

export type SeedDefaultCategoriesResult = {
  created: number;
  categories: Category[];
};

export const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
];

export function categoryTypeLabel(type: CategoryType): string {
  return CATEGORY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
