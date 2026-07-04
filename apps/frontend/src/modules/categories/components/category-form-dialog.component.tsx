'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { ColorInput } from '@/shared/components/ui/color-input';
import { Combobox } from '@/shared/components/ui/combobox';
import { Dialog } from '@/shared/components/ui/dialog';
import { IconCombobox } from '@/shared/components/ui/icon-combobox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import {
  CATEGORY_TYPE_OPTIONS,
  type Category,
  type CategoryFormValues,
  type CategoryType,
} from '@/modules/categories/types/category.type';

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  isSubmitting: boolean;
  onSubmit: (values: CategoryFormValues) => void;
};

const EMPTY_FORM: CategoryFormValues = {
  name: '',
  type: 'expense',
  color: '#059669',
  icon: '',
};

function categoryToFormValues(category: Category | null): CategoryFormValues {
  if (!category) return EMPTY_FORM;

  return {
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon ?? '',
  };
}

export function CategoryFormDialog(props: CategoryFormDialogProps) {
  return <CategoryFormDialogContent key={props.category?.id ?? 'new'} {...props} />;
}

function CategoryFormDialogContent({
  open,
  onOpenChange,
  category,
  isSubmitting,
  onSubmit,
}: CategoryFormDialogProps) {
  const [values, setValues] = useState<CategoryFormValues>(() => categoryToFormValues(category));
  const isEditing = Boolean(category);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title={isEditing ? 'Editar categoria' : 'Nova categoria'}
        description="Informe os dados da categoria."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="category-form" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar categoria'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              name="name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="category-color">Cor</Label>
            <ColorInput
              id="category-color"
              value={values.color}
              onChange={(nextValue) => setValues((current) => ({ ...current, color: nextValue }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category-type">Tipo</Label>
              <Combobox
                options={CATEGORY_TYPE_OPTIONS}
                value={values.type}
                onChange={(value) =>
                  setValues((current) => ({ ...current, type: value as CategoryType }))
                }
                placeholder="Selecione o tipo"
              />
            </div>

            <div>
              <Label htmlFor="category-icon">Ícone</Label>
              <IconCombobox
                id="category-icon"
                value={values.icon}
                onChange={(value) => setValues((current) => ({ ...current, icon: value }))}
                placeholder="Selecionar ícone (opcional)"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
}
