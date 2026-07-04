import { apiRequest } from '@/shared/util/http-client.util';
import type { Category, CategoryType, SeedDefaultCategoriesResult } from '@/modules/categories/types/category.type';

export type CreateCategoryPayload = {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export async function listCategories(token: string, signal?: AbortSignal): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', { method: 'GET', token, expectedStatus: 200, signal });
}

export async function seedDefaultCategories(token: string): Promise<SeedDefaultCategoriesResult> {
  return apiRequest<SeedDefaultCategoriesResult>('/categories/seed-defaults', {
    method: 'POST',
    token,
    expectedStatus: 200,
  });
}

export async function createCategory(token: string, payload: CreateCategoryPayload): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    token,
    body: payload,
    expectedStatus: 201,
  });
}

export async function updateCategory(
  token: string,
  id: string,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
    expectedStatus: 200,
  });
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await apiRequest<void>(`/categories/${id}`, { method: 'DELETE', token, expectedStatus: 204 });
}
