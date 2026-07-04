export type ImportFormat = 'csv' | 'ofx';

export type ImportStatus = 'processing' | 'done' | 'failed';

export type ImportRecord = {
  id: string;
  fileName: string;
  format: ImportFormat;
  status: ImportStatus;
  accountId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  userId: string;
  createdAt: string;
};

export type ImportStatementResult = {
  importId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
};

export type ListImportsResult = {
  items: ImportRecord[];
  total: number;
};

export const ACCEPTED_IMPORT_EXTENSIONS = ['.csv', '.ofx'];

export function hasAcceptedImportExtension(fileName: string): boolean {
  const normalized = fileName.toLowerCase();
  return ACCEPTED_IMPORT_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function importStatusLabel(status: ImportStatus): string {
  switch (status) {
    case 'done':
      return 'Concluído';
    case 'failed':
      return 'Com erros';
    default:
      return 'Processando';
  }
}
