import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import type {
  ImportStatementResult,
  ListImportsResult,
} from '@/modules/imports/types/import.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ImportsApiError extends Error {
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
  throw new ImportsApiError(errorCodes);
}

export async function importStatement(
  token: string,
  file: File,
  accountId: string,
): Promise<ImportStatementResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', accountId);

  const response = await fetch(`${API_URL}/imports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status !== 201) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as ImportStatementResult;
}

export async function listImports(token: string): Promise<ListImportsResult> {
  const response = await fetch(`${API_URL}/imports`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    await parseErrorResponse(response);
  }

  return (await response.json()) as ListImportsResult;
}
