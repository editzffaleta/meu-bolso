'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { StandardDialogContent } from '@/shared/components/ui/standard-dialog-content';
import type { Category } from '@/modules/categories/types/category.type';
import type { CategorizationRuleFormValues } from '@/modules/categories/types/categorization-rule.type';

type CategorizationRuleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: CategorizationRuleFormValues) => void;
};

const EMPTY_FORM: CategorizationRuleFormValues = {
  keyword: '',
  categoryId: '',
  priority: '0',
};

export function CategorizationRuleFormDialog(props: CategorizationRuleFormDialogProps) {
  return <CategorizationRuleFormDialogContent key={props.open ? 'open' : 'closed'} {...props} />;
}

function CategorizationRuleFormDialogContent({
  open,
  onOpenChange,
  categories,
  isSubmitting,
  onSubmit,
}: CategorizationRuleFormDialogProps) {
  const [values, setValues] = useState<CategorizationRuleFormValues>(EMPTY_FORM);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title="Nova regra de categorização"
        description="Transações cuja descrição contém a palavra-chave são categorizadas automaticamente."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="categorization-rule-form" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar regra'}
            </Button>
          </>
        }
      >
        <form id="categorization-rule-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="rule-keyword">Palavra-chave</Label>
            <Input
              id="rule-keyword"
              name="keyword"
              placeholder="ex.: uber"
              value={values.keyword}
              onChange={(event) => setValues((current) => ({ ...current, keyword: event.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="rule-category">Categoria</Label>
            <Combobox
              options={categoryOptions}
              value={values.categoryId}
              onChange={(value) => setValues((current) => ({ ...current, categoryId: value }))}
              placeholder="Selecione a categoria"
              emptyText="Nenhuma categoria encontrada."
            />
          </div>

          <div>
            <Label htmlFor="rule-priority">Prioridade (opcional)</Label>
            <Input
              id="rule-priority"
              name="priority"
              type="number"
              value={values.priority}
              onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value }))}
            />
          </div>
        </form>
      </StandardDialogContent>
    </Dialog>
  );
}
