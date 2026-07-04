'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { CategorizationRulesComponent } from '@/modules/categories/components/categorization-rules.component';
import { CategoryFormDialog } from '@/modules/categories/components/category-form-dialog.component';
import { CategoryListItem } from '@/modules/categories/components/category-list-item.component';
import type { Category, CategoryFormValues } from '@/modules/categories/types/category.type';
import {
  CategoriesApiError,
  createCategory,
  deleteCategory,
  listCategories,
  seedDefaultCategories,
  updateCategory,
} from '@/modules/categories/util/categories-api.util';

function reportApiErrors(error: unknown) {
  if (error instanceof CategoriesApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function CategoriesComponent() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryPendingDeletion, setCategoryPendingDeletion] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasSeeded = useRef(false);

  const loadCategories = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      let data = await listCategories(token);

      if (data.length === 0 && !hasSeeded.current) {
        hasSeeded.current = true;
        await seedDefaultCategories(token);
        data = await listCategories(token);
      }

      setCategories(data);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadCategories();
  }, [loadCategories]);

  function handleOpenCreate() {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(category: Category) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: CategoryFormValues) {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        type: values.type,
        color: values.color,
        icon: values.icon.trim() ? values.icon.trim() : undefined,
      };

      if (editingCategory) {
        await updateCategory(token, editingCategory.id, payload);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategory(token, payload);
        toast.success('Categoria criada com sucesso!');
      }

      setIsFormOpen(false);
      await loadCategories();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !categoryPendingDeletion) return;

    setIsDeleting(true);
    try {
      await deleteCategory(token, categoryPendingDeletion.id);
      toast.success('Categoria excluída com sucesso!');
      setCategoryPendingDeletion(null);
      await loadCategories();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Categorias"
        title="Categorias"
        subtitle="Organize suas transações por categoria"
        aside={
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Nova categoria
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {isLoading ? (
          <CategoriesSkeleton />
        ) : categories.length === 0 ? (
          <EmptyCategoriesState onCreate={handleOpenCreate} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {categories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                onEdit={handleOpenEdit}
                onDelete={setCategoryPendingDeletion}
              />
            ))}
          </div>
        )}

        <CategorizationRulesComponent categories={categories} />
      </div>

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={Boolean(categoryPendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setCategoryPendingDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir categoria"
        description="Esta ação remove a categoria selecionada de forma permanente."
        itemLabel="Categoria"
        itemValue={categoryPendingDeletion?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`category-skeleton-${index}`}
          className="h-16 animate-pulse border-b border-border bg-muted/40 last:border-b-0"
        />
      ))}
    </div>
  );
}

function EmptyCategoriesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
        <Tags className="size-8 text-primary" />
      </span>
      <div className="space-y-1">
        <h3 className="text-lg font-bold">Nenhuma categoria cadastrada</h3>
        <p className="text-sm text-muted-foreground">
          Crie sua primeira categoria para organizar suas transações.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Nova categoria
      </Button>
    </div>
  );
}
