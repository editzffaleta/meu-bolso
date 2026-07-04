'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1fr',
        gap: 18,
        alignItems: 'start',
        animation: 'fadeUp .35s ease',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>Categorias</div>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-line)',
              borderRadius: 9,
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
          >
            <Icon name="add" size={17} />
            Nova
          </button>
        </div>

        {isLoading ? (
          <CategoriesSkeleton />
        ) : categories.length === 0 ? (
          <EmptyCategoriesState onCreate={handleOpenCreate} />
        ) : (
          <div>
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
      </div>

      <CategorizationRulesComponent categories={categories} />

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
    <div aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`category-skeleton-${index}`}
          style={{
            height: 64,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

function EmptyCategoriesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '56px 20px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--primary-soft)',
        }}
      >
        <Icon name="sell" size={32} color="var(--primary)" />
      </span>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Nenhuma categoria cadastrada</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Crie sua primeira categoria para organizar suas transações.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--primary)',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13.5,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Icon name="add" size={19} />
        Nova categoria
      </button>
    </div>
  );
}
