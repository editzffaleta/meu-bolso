import { apiRequest } from '@/shared/util/http-client.util';
import type {
  ImportStatementResult,
  ListImportsResult,
} from '@/modules/imports/types/import.type';

export async function importStatement(
  token: string,
  file: File,
  accountId: string,
): Promise<ImportStatementResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', accountId);

  return apiRequest<ImportStatementResult>('/imports', {
    method: 'POST',
    token,
    body: formData,
    expectedStatus: 201,
  });
}

export async function listImports(token: string): Promise<ListImportsResult> {
  return apiRequest<ListImportsResult>('/imports', { method: 'GET', token, expectedStatus: 200 });
}
