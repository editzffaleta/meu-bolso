import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type { Category, CategoryType, SeedDefaultCategoriesResult } from '@/modules/categories/types/category.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type CreateCategoryPayload = {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export class CategoriesApiError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join(', '));
    this.errors = errors;
  }
}

async function parseErrorResponse(response: Response): Promise<never> {
  let body: ApiErrorResponse | null = null;
  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    body = null;
  }

  const errorCodes = body?.errors?.length ? body.errors : ['INTERNAL_SERVER_ERROR'];
  throw new CategoriesApiError(errorCodes);
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listCategories(token: string): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Category[];
}

export async function seedDefaultCategories(token: string): Promise<SeedDefaultCategoriesResult> {
  const response = await fetch(`${API_URL}/categories/seed-defaults`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as SeedDefaultCategoriesResult;
}

export async function createCategory(token: string, payload: CreateCategoryPayload): Promise<Category> {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Category;
}

export async function updateCategory(
  token: string,
  id: string,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as Category;
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (response.status !== 204) {
    await parseErrorResponse(response);
  }
}
